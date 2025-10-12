import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { 
  processVideo, 
  sendNotificationEmail,
  handleVideoProcessed,
  handleVideoProcessingFailure,
  checkProcessingTimeout,
  generateVideo
} from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processVideo, sendNotificationEmail, handleVideoProcessed, handleVideoProcessingFailure, checkProcessingTimeout, generateVideo],
});
