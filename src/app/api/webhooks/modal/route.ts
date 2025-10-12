import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prismaDB } from "@/lib/prisma";
import type { TranscriptWord } from "@/lib/types";

interface ModalWebhookPayload {
  user_id: string;
  project_id: string;
  status: "completed" | "failed" | "ready_for_review"; // Add new status
  clips?: {
    raw_clip_url: string;
    transcript_segments: TranscriptWord[];
    hook: string;
    start: number;
    end: number;
  }[];
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
    const { user_id: userId, project_id: projectId, status, clips, error } = payload;
    
    console.log("Webhook received payload:", JSON.stringify(payload, null, 2));

    if (!userId || !projectId || !status) {
      return NextResponse.json({ message: "Missing required payload fields" }, { status: 400 });
    }

    switch (status) {
      case "ready_for_review":
        if (!clips || clips.length === 0) {
          console.warn(`Webhook received 'ready_for_review' for project ${projectId} but no clips were provided.`);
          // Optionally, handle this as a failure
          await inngest.send({
              name: "video-processing-failed-event",
              data: {
                  projectId,
                  userId,
                  reason: "Processing completed but no clips were generated.",
              },
          });
          return NextResponse.json({ message: "Event received, no clips to process" }, { status: 202 });
        }

        console.log(`Webhook received: Project ${projectId} is ready for review with ${clips.length} clips.`);

        // Use a transaction to ensure all or nothing is written to the DB
        await prismaDB.$transaction(async (prisma) => {
          // 1. Verify project exists and belongs to the user
          const project = await prisma.project.findFirst({
            where: { 
              id: projectId,
              userId: userId 
            }
          });
          
          if (!project) {
            throw new Error(`Project ${projectId} not found or doesn't belong to user ${userId}`);
          }

          // 2. Check if clips already exist for this project (duplicate prevention)
          const existingClips = await prisma.clip.findMany({
            where: { projectId: projectId },
            select: { id: true, rawClipUrl: true, s3Key: true }
          });

          if (existingClips.length > 0) {
            console.log(`Project ${projectId} already has ${existingClips.length} clips. Skipping duplicate creation.`);
            // Update project status but don't create duplicate clips
            await prisma.project.update({
              where: { id: projectId },
              data: { status: "processed" },
            });
            return; // Exit early - no need to create clips
          }

          // 3. Additional check: prevent URL-based duplicates within the incoming clips
          const incomingUrls = clips.map(clip => clip.raw_clip_url);
          const urlDuplicates = incomingUrls.filter((url, index) => incomingUrls.indexOf(url) !== index);
          if (urlDuplicates.length > 0) {
            console.warn(`Duplicate URLs detected in incoming clips: ${urlDuplicates.join(', ')}`);
          }

          // 4. Update the project status
          await prisma.project.update({
            where: { id: projectId },
            data: { status: "processed" },
          });

          // 5. Create all the new clips with validation
          const clipData = clips.map((clip, index) => {
            // Validate required fields
            if (!clip.raw_clip_url) {
              throw new Error(`Clip ${index} missing raw_clip_url`);
            }
            if (typeof clip.start !== 'number' || typeof clip.end !== 'number') {
              throw new Error(`Clip ${index} has invalid start/end times`);
            }
            if (clip.start >= clip.end) {
              throw new Error(`Clip ${index} has invalid time range: start ${clip.start} >= end ${clip.end}`);
            }

            // Derive s3Key from rawClipUrl for backward compatibility
            let derivedS3Key: string | undefined = undefined;
            try {
              const u = new URL(clip.raw_clip_url);
              derivedS3Key = u.pathname.replace(/^\//, "");
            } catch (urlError) {
              console.warn(`Failed to derive S3 key from URL ${clip.raw_clip_url}:`, urlError);
            }

            return {
              rawClipUrl: clip.raw_clip_url,  // New field for new system
              s3Key: derivedS3Key,           // Legacy field for existing clips compatibility
              transcript: clip.transcript_segments,
              hook: clip.hook || "",
              start: clip.start,
              end: clip.end,
              projectId: projectId,
              userId: userId,
            };
          });

          await prisma.clip.createMany({
            data: clipData,
          });
        });

        // Optionally, send a notification that the clips are ready
        await inngest.send({
          name: "video-processed-event", // Re-using existing event for success notification
          data: { projectId, userId },
        });

        break;
        
      case "completed": // Keep old completed status for backward compatibility or other uses
        await inngest.send({
          name: "video-processed-event",
          data: { projectId, userId },
        });
        console.log(`Webhook received: Project ${projectId} completed.`);
        break;

      case "failed":
        const failureReason = error?.message || "Processing failed on external service.";
        console.error(`Webhook received: Project ${projectId} failed. Reason: ${failureReason}`, payload);
        
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
        // This can catch the old "completed" status or any other unexpected status
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
