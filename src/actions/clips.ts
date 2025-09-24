"use server";

import { revalidatePath } from "next/cache";
import { prismaDB } from "@/lib/prisma";
import { z } from "zod";
import { getUserData } from "./user";

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
});

type ClipUpdateData = z.infer<typeof clipUpdateSchema>;

export async function updateClip(data: ClipUpdateData, renderData: { projectCaptionStyle: number, rawClipUrl: string }) {
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

    await prismaDB.clip.update({
      where: { id: clipId },
      data: {
        ...(updateData.transcript && { transcript: updateData.transcript }),
        ...(updateData.hook && { hook: updateData.hook }),
        ...(updateData.hookStyle && { hookStyle: updateData.hookStyle }),
        ...(updateData.captionsStyle && { captionsStyle: updateData.captionsStyle }),
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
