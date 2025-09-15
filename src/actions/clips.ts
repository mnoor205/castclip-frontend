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

    // --- Trigger Backend Rendering ---
    const renderEndpoint = process.env.RENDER_VIDEO_ENDPOINT;
    if (!renderEndpoint) {
      console.error("CRITICAL: RENDER_VIDEO_ENDPOINT is not set. Cannot trigger video render.");
      // In a "save and wait" context, this should be a hard error for the user.
      throw new Error("Cannot trigger video render: endpoint not configured.");
    }

    // Combine data for the payload. The most up-to-date data is what we just intended to save.
    const renderPayload = {
      clip_id: clipId,
      raw_clip_url: renderData.rawClipUrl,
      transcript_segments: data.transcript,
      hook: data.hook,
      hook_style: data.hookStyle,
      caption_style_preset: renderData.projectCaptionStyle,
      captions_style: data.captionsStyle,
    };

    // --- TEMPORARY DEBUGGING: Save payload to a file ---
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'render_payload_log.txt');
    fs.writeFileSync(filePath, JSON.stringify(renderPayload, null, 2));
    console.log(`Render payload saved to ${filePath}`);
    // --- END TEMPORARY DEBUGGING ---

    /*
    console.log("Sending payload to render endpoint:", JSON.stringify(renderPayload, null, 2));

    const renderResponse = await fetch(renderEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(renderPayload),
    });

    if (!renderResponse.ok) {
      const errorBody = await renderResponse.text();
      console.error(`Backend render failed with status ${renderResponse.status}: ${errorBody}`);
      throw new Error(`The video rendering service failed. Please try again later.`);
    }

    console.log("Backend render triggered successfully.");
    */
    
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
