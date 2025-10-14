import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prismaDB } from "@/lib/prisma";
import type { TranscriptWord } from "@/lib/types";

interface ModalWebhookPayload {
  userId: string;
  projectId: string;
  status: "completed" | "failed" ;
  clips?: {
    s3Key: string; // Format: {userid}/{projectid}/clip_{i}.mp4
    transcriptSegments: TranscriptWord[];
    hook: string;
    start: number;
    end: number;
  }[];
  totalClips?: number;
  clipIndex?: number;
  isLastClip?: boolean;
  error?: {
    message: string;
    type: string;
  };
}

export async function POST(req: Request) {
  // --- Security: Verify the incoming request ---
  const headersList = await headers();
  const providedSecret = headersList.get("Authorization")?.split(" ")[1];
  const internalSecret = process.env.MODAL_WEBHOOK_SECRET;

  if (!internalSecret) {
    console.error("CRITICAL: MODAL_WEBHOOK_SECRET is not set. Denying all requests.");
    return NextResponse.json({ message: "Internal configuration error" }, { status: 500 });
  }

  if (providedSecret !== internalSecret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // --- Process the valid request ---
  try {
    const payload: ModalWebhookPayload = await req.json();
    const { userId, projectId, status, clips, totalClips, clipIndex, isLastClip, error } = payload;
    
    console.log("Webhook received payload:", JSON.stringify(payload, null, 2));

    if (!userId || !projectId || !status) {
      return NextResponse.json({ message: "Missing required payload fields" }, { status: 400 });
    }

    switch (status) {
      case "completed":
        if (!clips || clips.length === 0) {
          console.warn(`Webhook received 'completed' for project ${projectId} but no clips were provided.`);
          return NextResponse.json({ message: "Event received, no clips to process" }, { status: 202 });
        }

        if (totalClips === undefined || clipIndex === undefined || isLastClip === undefined) {
          throw new Error("Missing required fields: totalClips, clipIndex, or isLastClip");
        }

        // Since clips come one at a time, we expect exactly 1 clip
        const clip = clips[0];
        
        console.log(`Webhook received: Clip ${clipIndex + 1}/${totalClips} for project ${projectId}`);

        // Verify project exists and belongs to the user
        const project = await prismaDB.project.findFirst({
          where: { 
            id: projectId,
            userId: userId 
          },
          select: {
            id: true,
            user: {
              select: {
                email: true,
                name: true,
              }
            }
          }
        });
        
        if (!project) {
          throw new Error(`Project ${projectId} not found or doesn't belong to user ${userId}`);
        }

        // Validate clip data
        if (!clip.s3Key) {
          throw new Error(`Clip ${clipIndex} missing s3Key`);
        }
        if (typeof clip.start !== 'number' || typeof clip.end !== 'number') {
          throw new Error(`Clip ${clipIndex} has invalid start/end times`);
        }
        if (clip.start >= clip.end) {
          throw new Error(`Clip ${clipIndex} has invalid time range: start ${clip.start} >= end ${clip.end}`);
        }

        // Create the clip in database
        await prismaDB.clip.create({
          data: {
            s3Key: clip.s3Key,
            transcript: clip.transcriptSegments,
            hook: clip.hook || "",
            start: clip.start,
            end: clip.end,
            projectId: projectId,
            userId: userId,
            status: "rendered" as const,
          },
        });

        console.log(`✅ Clip ${clipIndex + 1}/${totalClips} saved successfully`);

        // If this is the last clip, update project status and send email
        if (isLastClip) {
          await prismaDB.project.update({
            where: { id: projectId },
            data: { status: "processed" },
          });

          // Send email notification
          await inngest.send({
            name: "send-notification-email",
            data: {
              email: project.user.email,
              name: project.user.name,
              clipsCount: totalClips,
            },
          });

          console.log(`🎉 All ${totalClips} clips completed for project ${projectId}. Email notification sent.`);
        }

        break;

      case "failed":
        const failureReason = error?.message || "Processing failed on external service.";
        console.error(`Webhook received: Project ${projectId} failed. Reason: ${failureReason}`, payload);
        
        // Update project status to failed
        await prismaDB.project.update({
          where: { id: projectId },
          data: { 
            status: "failed",
            failureReason: failureReason,
          },
        });

        await inngest.send({
            name: "video-processing-failed-event",
            data: {
                projectId,
                userId,
                reason: failureReason,
            },
        });
        break;

      default:
        console.warn(`Webhook received with unhandled status '${status}' for project ${projectId}.`);
        break;
    }

    return NextResponse.json({ message: "Event received" }, { status: 202 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "No stack trace available";
    
    console.error("=== WEBHOOK PROCESSING ERROR ===");
    console.error("Error message:", errorMessage);
    console.error("Error stack:", errorStack);
    console.error("================================");
    
    return NextResponse.json({ 
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? errorMessage : undefined 
    }, { status: 500 });
  }
}
