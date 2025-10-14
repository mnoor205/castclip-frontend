import { NextResponse } from "next/server";
import { prismaDB } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const WEBHOOK_SECRET = process.env.VIDEO_GENERATION_WEBHOOK_SECRET;

const webhookPayloadSchema = z.object({
  success: z.boolean(),
  clipId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const authorizationHeader = req.headers.get("Authorization");
    if (authorizationHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = webhookPayloadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid payload", details: validation.error.format() }, { status: 400 });
    }

    const { success, clipId } = validation.data;

    if (!success) {
      // The backend indicated failure, mark clip as failed
      await prismaDB.clip.update({
        where: { id: clipId },
        data: { status: "failed" },
      });
      console.log(`Received unsuccessful generation notification for clip ${clipId}`);
      return NextResponse.json({ success: true, message: "Acknowledged unsuccessful status." });
    }

    const clip = await prismaDB.clip.findUnique({
      where: { id: clipId },
      select: {
        id: true,
        projectId: true,
      }
    });

    if (!clip) {
      return NextResponse.json({ error: "Clip not found" }, { status: 404 });
    }

    await prismaDB.clip.update({
      where: { id: clipId },
      data: {
        status: "rendered",
      },
    });

    // Revalidate the edit page so the UI updates automatically
    revalidatePath(`/projects/${clip.projectId}/edit/${clipId}`);
    revalidatePath(`/projects/${clip.projectId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing video-generated webhook:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}
