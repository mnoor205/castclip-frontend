import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

interface ModalWebhookPayload {
  user_id: string;
  project_id: string;
  status: "completed" | "failed" | "error";
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
    const { user_id: userId, project_id: projectId, status, error } = payload;

    if (!userId || !projectId || !status) {
      return NextResponse.json({ message: "Missing required payload fields" }, { status: 400 });
    }
    
    if (status === "completed") {
      await inngest.send({
        name: "video-processed-event",
        data: { projectId, userId },
      });
      console.log(`Webhook received: Project ${projectId} completed.`);
    } else {
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
    }

    return NextResponse.json({ message: "Event received" }, { status: 202 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook processing error:", errorMessage);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
