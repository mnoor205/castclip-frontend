"use server";

import { revalidatePath } from "next/cache";
import { prismaDB } from "@/lib/prisma";
import { z } from "zod";
import { getUserData } from "./user";
import { inngest } from "@/inngest/client";
import type { TextStyle } from "@/stores/clip-editor-store";

// Define Zod schema for validation
const clipUpdateSchema = z.object({
  clipId: z.string().uuid(),
  transcript: z.array(z.object({
    word: z.string(),
    start: z.number(),
    end: z.number(),
  })).optional(),
  hook: z.string().optional(),
  hookStyle: z.record(z.string(), z.any()).optional(),
  captionsStyle: z.record(z.string(), z.any()).optional(),
  captionStyleId: z.number().optional(),
});

type ClipUpdateData = z.infer<typeof clipUpdateSchema>;

interface RenderData {
  projectCaptionStyle: number;
  s3Key: string;
  transcript: {
    word: string;
    start: number;
    end: number;
  }[];
  hook?: string | null;
  hookStyle?: TextStyle | null;
  captionsStyle?: TextStyle | null;
  captionStyleId?: number | null;
}

export async function updateClip(data: ClipUpdateData, renderData: RenderData) {
  const user = await getUserData()
  if (!user?.id) {
      return { success: false, error: "Authentication required" };
  }

  const validation = clipUpdateSchema.safeParse(data);
  if (!validation.success) {
    console.error("Zod validation failed:", validation.error.format());
    return { success: false, error: "Invalid data", details: validation.error.format() };
  }

  const { clipId, ...updateData } = validation.data;

  try {
    const clip = await prismaDB.clip.findUnique({
      where: { id: clipId },
      select: { projectId: true },
    });

    if (!clip) {
      return { success: false, error: "Clip not found" };
    }

    const project = await prismaDB.project.findUnique({
      where: { id: clip.projectId },
      select: { userId: true },
    });

    if (project?.userId !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const { captionStyleId, ...clipUpdateData } = updateData;

    const updatedClip = await prismaDB.clip.update({
      where: { id: clipId },
      data: {
        ...(clipUpdateData.transcript && { transcript: clipUpdateData.transcript }),
        ...(clipUpdateData.hook && { hook: clipUpdateData.hook }),
        ...(clipUpdateData.hookStyle && { hookStyle: clipUpdateData.hookStyle }),
        ...(clipUpdateData.captionsStyle && { captionsStyle: clipUpdateData.captionsStyle }),
        status: "processing", // Mark as processing while video is being generated
      },
    });
    
    // If captionStyleId is provided, update the project
    if (captionStyleId !== undefined && captionStyleId !== null) {
      await prismaDB.project.update({
        where: { id: clip.projectId },
        data: {
          captionStyle: captionStyleId,
        },
      });
    }

    // After successfully updating, trigger the video generation
    await inngest.send({
      name: "video/generate",
      data: {
        type: "edit",
        clipId: updatedClip.id,
        userId: user.id,
        projectId: clip.projectId,
        s3Key: renderData.s3Key,
        transcript: renderData.transcript,
        hook: renderData.hook,
        hookStyle: renderData.hookStyle,
        captionsStyle: renderData.captionsStyle,
        captionStyleId: renderData.captionStyleId,
      },
    });

    revalidatePath(`/projects/${clip.projectId}`);

    return { success: true };

  } catch (error) {
    console.error("Failed to update and render clip:", error);
    
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function checkClipStatus(clipId: string) {
  try {
    const user = await getUserData();
    if (!user?.id) {
      return { success: false, error: "Authentication required", isRendered: false };
    }

    const clip = await prismaDB.clip.findUnique({
      where: { id: clipId },
      select: { 
        status: true,
        s3Key: true,
        userId: true,
      },
    });

    if (!clip) {
      return { success: false, error: "Clip not found", isRendered: false };
    }

    if (clip.userId !== user.id) {
      return { success: false, error: "Unauthorized", isRendered: false };
    }

    // Check if clip status is "rendered"
    const isRendered = clip.status === "rendered";

    return { success: true, isRendered, renderedClip: isRendered ? clip : null };
  } catch (error) {
    console.error("Error checking clip status:", error);
    return { success: false, error: "Failed to check clip status", isRendered: false };
  }
}
