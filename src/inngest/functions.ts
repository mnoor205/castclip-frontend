import { prismaDB } from "@/lib/prisma";
import { inngest } from "./client";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { sendMail } from "@/lib/send-mail";

const PROCESSING_TIMEOUT = "45m"; // Generous timeout for a 30-min job

// 1. The Initiator: Starts the process and sets up a safety net.
export const processVideo = inngest.createFunction(
  {
    id: "process-video",
    retries: 2,
    concurrency: {
      limit: 1, // Only one job per user at a time.
      key: "event.data.userId",
    },
  },
  { event: "process-video-events" },
  async ({ event, step }) => {
    const { projectId, clipCount, captionStyle } = event.data;

    const { userId, credits, s3Key, externalUrl, source } = await step.run(
      "get-project-details",
      async () => {
        const project = await prismaDB.project.findUniqueOrThrow({
          where: { id: projectId },
          select: {
            user: { select: { id: true, credits: true } },
            s3Key: true,
            externalUrl: true,
            source: true,
          },
        });
        return {
          userId: project.user.id,
          credits: project.user.credits,
          s3Key: project.s3Key,
          externalUrl: project.externalUrl,
          source: project.source,
        };
      }
    );

    const affordableClipCount = Math.min(Math.floor(credits / 2), clipCount);

    if (affordableClipCount <= 0) {
      await step.run("set-status-no-credits", () =>
        prismaDB.project.update({
          where: { id: projectId },
          data: { status: "no credits" },
        })
      );
      return { status: "skipped", reason: "Insufficient credits" };
    }

    await step.run("set-status-processing", () =>
      prismaDB.project.update({
        where: { id: projectId },
        data: { status: "processing" },
      })
    );

    await step.run("trigger-video-processing-service", async () => {
      const keyForProcessing = source === "UPLOADED_FILE" ? s3Key : externalUrl;
      if (!keyForProcessing) {
        throw new Error(`No processing key for project ${projectId}`);
      }
      
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/modal`;
        
      const response = await fetch(process.env.PROCESS_VIDEO_ENDPOINT!, {
        method: "POST",
        body: JSON.stringify({
          s3_key: keyForProcessing,
          ids: `${userId}/${projectId}`,
          clip_count: affordableClipCount,
          style: captionStyle,
          webhook_url: webhookUrl,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.PROCESS_VIDEO_ENDPOINT_AUTH}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Trigger failed: ${response.status}`);
      }
    });

    if (source === "VIDEO_URL") {
      await step.run("save-s3-key-for-url-project", () =>
        prismaDB.project.update({
          where: { id: projectId },
          data: { s3Key: `${userId}/${projectId}/original.mp4` },
        })
      );
    }
    
    // Safety Net: Schedule a guardian to check on this job later.
    await step.sleep("wait-for-timeout", PROCESSING_TIMEOUT);
    
    await step.sendEvent("check-timeout", {
      name: "check-processing-timeout",
      data: { projectId },
    });
    
    return { status: "initiated" };
  }
);

// 2. The Finisher: Handles the successful completion of a job.
export const handleVideoProcessed = inngest.createFunction(
  {
    id: "handle-video-processed",
    retries: 3, // Retry DB operations on transient errors
  },
  { event: "video-processed-event" },
  async ({ event, step }) => {
    const { projectId } = event.data;

    const project = await step.run("get-project-and-user-data", () =>
      prismaDB.project.findUniqueOrThrow({
        where: { id: projectId },
        select: {
          clipCount: true,
          user: { select: { id: true, credits: true, email: true, name: true } },
        },
      })
    );
    
    if (!project) return { status: "skipped", reason: "Project not found" };

    const folderPrefix = `${project.user.id}/${projectId}`;
    const allKeys = await step.run("list-s3-objects", () => lists3ObjectsByPrefix(folderPrefix));
    const clipKeys = allKeys.filter((key) => key && !key.endsWith("original.mp4")) as string[];
    
    if (clipKeys.length > 0) {
      await step.run("create-clip-records", () =>
        prismaDB.clip.createMany({
          data: clipKeys.map((clipKey) => ({
            s3Key: clipKey,
            projectId,
            userId: project.user.id,
          })),
        })
      );
    }

    const affordableClipCount = Math.min(Math.floor(project.user.credits / 2), project.clipCount);
    const creditsToDeduct = Math.min(clipKeys.length, affordableClipCount) * 2;
    if (creditsToDeduct > 0) {
      await step.run("deduct-credits", () =>
        prismaDB.user.update({
          where: { id: project.user.id },
          data: { credits: { decrement: creditsToDeduct } },
        })
      );
    }

    await step.run("set-status-processed", () =>
      prismaDB.project.update({
        where: { id: projectId },
        data: { status: "processed" },
      })
    );
    
    if (clipKeys.length > 0) {
      await step.sendEvent("send-email-notification", {
        name: "send-notification-email",
        data: {
          email: project.user.email,
          name: project.user.name,
          clipsCount: clipKeys.length,
        },
      });
    }

    // --- Final Step: Cancel the timeout guardian from the original run ---
    // await step.cancel("cancel-timeout-guardian", {
    //   runId: runId,
    //   stepId: "wait-for-timeout", // This must match the name of the step.sleep() call.
    // });

    return { status: "completed", clipsCreated: clipKeys.length };
  }
);

// New Function: Handles failures reported by the external service.
export const handleVideoProcessingFailure = inngest.createFunction(
  { id: "handle-video-processing-failure", retries: 2 },
  { event: "video-processing-failed-event" },
  async ({ event, step }) => {
    const { projectId, reason } = event.data;

    await step.run("set-status-failed-with-reason", () =>
      prismaDB.project.update({
        where: { id: projectId },
        data: { 
          status: "failed",
          failureReason: reason,
        },
      })
    );

    console.error(`Project ${projectId} marked as failed. Reason: ${reason}`);
    
    return { status: "failure_handled" };
  }
);


// 3. The Guardian: Our safety net for jobs that get stuck.
export const checkProcessingTimeout = inngest.createFunction(
  { id: "check-processing-timeout", retries: 2 },
  { event: "check-processing-timeout" },
  async ({ event, step }) => {
    const { projectId } = event.data;

    const project = await step.run("get-project-status", () =>
      prismaDB.project.findUnique({
        where: { id: projectId },
        select: { status: true },
      })
    );

    if (project?.status === "processing") {
      await step.run("set-status-failed", () =>
        prismaDB.project.update({
          where: { id: projectId },
          data: { 
            status: "failed",
            failureReason: `Processing timed out after ${PROCESSING_TIMEOUT}.`,
          },
        })
      );
      return { status: "failed", reason: "Processing timed out" };
    }

    return { status: "ok", reason: "Project already completed or failed" };
  }
);

// Email Sending Function (remains the same)
export const sendNotificationEmail = inngest.createFunction(
  {
    id: "send-notification-email",
    retries: 2,
  },
  { event: "send-notification-email" },
  async ({ event, step }) => {
    const { email, name, clipsCount } = event.data;
    
    await step.run("send-email", () =>
      sendMail({
        to: email,
        subject: "Your Clips Are Ready!",
        text: `Hi ${name}!\n\nYour ${clipsCount} video clips have been generated. Go to your projects page to view and download them. Thanks for using CastClip!\n\n- CastClip Team\n\nFor any questions and support feel free to reach out at email@castclip.app`,
        html: `
          <p>Hi ${name}!</p>
          <p>Your ${clipsCount} video clips have been generated. Go to your <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects">projects page</a> to view and download them. Thanks for using CastClip!</p>
          <p>- CastClip Team</p>
          <br>
          <p>For any questions and support feel free to reach out at <a href="mailto:email@castclip.app">email@castclip.app</a></p>
        `,
      })
    );
    return { status: "sent" };
  }
);

// S3 Utility Function (remains the same)
async function lists3ObjectsByPrefix(prefix: string) {
  const s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.S3_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET_NAME!,
    Prefix: prefix,
  });
  const response = await s3Client.send(listCommand);
  return response.Contents?.map((item) => item.Key).filter(Boolean) || [];
}