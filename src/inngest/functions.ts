import { prismaDB } from "@/lib/prisma";
import { inngest } from "./client";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3"
import { sendMail } from "@/lib/send-mail";

export const processVideo = inngest.createFunction(
  {
    id: "process-video",
    retries: 1, // Tries 2 times
    concurrency: {
      limit: 1,
      key: "event.data.userId"
    }
  },
  { event: "process-video-events" },
  async ({ event, step }) => {
    const { uploadedFileId, clipCount, captionStyle } = event.data

    try {
      const { userId, credits, email, name, s3Key } = await step.run("check-credits", async () => {
        const uploadedFile = await prismaDB.uploadedFile.findUniqueOrThrow({
          where: {
            id: uploadedFileId
          },
          select: {
            user: {
              select: {
                id: true,
                credits: true,
                email: true,
                name: true
              }
            },
            s3Key: true,
          }
        })

        return {
          userId: uploadedFile.user.id,
          credits: uploadedFile.user.credits,
          email: uploadedFile.user.email,
          name: uploadedFile.user.name,
          s3Key: uploadedFile.s3Key
        }
      })

      // Calculate how many clips the user can afford (each clip costs 2 credits)
      const affordableClipCount = Math.min(Math.floor(credits / 2), clipCount);
      
      if (affordableClipCount > 0) {
        await step.run("set-status-processing", async () => {
          await prismaDB.uploadedFile.update({
            where: {
              id: uploadedFileId,
            },
            data: {
              status: "processing"
            }
          })
        })

        await step.run("process-video-external", async () => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 20 * 60 * 1000) // 20 minute timeout
          
          try {
            const response = await step.fetch(process.env.PROCESS_VIDEO_ENDPOINT!, {
              method: "POST",
              body: JSON.stringify({ s3_key: s3Key, clip_count: affordableClipCount, style: captionStyle }),
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.PROCESS_VIDEO_ENDPOINT_AUTH}`
              },
              signal: controller.signal
            })
            
            clearTimeout(timeoutId)
            
            if (!response.ok) {
              throw new Error(`Video processing failed with status: ${response.status}`)
            }
            
            return response
          } catch (error) {
            clearTimeout(timeoutId)
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Video processing timed out after 20 minutes')
            }
            throw error
          }
        })

        const { clipsFound } = await step.run("create-clips-in-db", async () => {
          const parts = s3Key.split("/")
          const folderPrefix = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : s3Key

          const allKeys = await lists3ObjectsByPrefix(folderPrefix)

          const clipKeys = allKeys.filter(
            (key): key is string =>
              key !== undefined && !key.endsWith("original.mp4")
          )

          if (clipKeys.length > 0) {
            await prismaDB.clip.createMany({
              data: clipKeys.map((clipKey) => ({
                s3Key: clipKey,
                uploadedFileId,
                userId
              }))
            })
          }

          return { clipsFound: clipKeys.length }
        })

        await step.run("deduct-credits", async () => {
          // Only deduct credits for clips that were actually created
          const creditsToDeduct = Math.min(clipsFound, affordableClipCount) * 2
          await prismaDB.user.update({
            where: {
              id: userId
            },
            data: {
              credits: {
                decrement: creditsToDeduct
              }
            }
          })
        })

        await step.run("set-status-processed", async () => {
          await prismaDB.uploadedFile.update({
            where: {
              id: uploadedFileId,
            },
            data: {
              status: "processed"
            }
          })
        })

        // Send email notification in a separate, non-blocking step
        await step.run("send-email-notification", async () => {
          try {
            await inngest.send({
              name: "send-notification-email",
              data: {
                email,
                name,
                clipsCount: clipsFound
              }
            })
          } catch (error) {
            // Log the error but don't throw it - email failure shouldn't affect video processing status
            console.error("Failed to trigger email notification:", error)
          }
        })

      } else {
        await step.run("set-status-no-credits", async () => {
          await prismaDB.uploadedFile.update({
            where: {
              id: uploadedFileId,
            },
            data: {
              status: "no credits"
            }
          })
        })
      }
    } catch (error) {
      console.error("Video processing failed:", error)
      await step.run("set-status-failed", async () => {
      await prismaDB.uploadedFile.update({
        where: {
          id: uploadedFileId,
        },
        data: {
          status: "failed"
        }
        })
      })
    }
  },
);

export const sendNotificationEmail = inngest.createFunction(
  {
    id: "send-notification-email",
    retries: 1, // Try email sending up to 2 times
  },
  { event: "send-notification-email" },
  async ({ event, step }) => {
    const { email, name, clipsCount } = event.data

    await step.run("send-email", async () => {
      await sendMail({
        to: email,
        subject: "Your Clips Are Ready!",
        text: `Hi! Your ${clipsCount} video clip${clipsCount !== 1 ? 's have' : ' has'} been generated. Go to your dashboard to view and download them.`,
        html: `<p>Hi ${name}!</p><p>Your ${clipsCount} video clip${clipsCount !== 1 ? 's have' : ' has'} been generated. Go to your <a href="https://castclip.app/dashboard">dashboard</a> to view and download them.</p>`
      })
    })
  }
);

async function lists3ObjectsByPrefix(prefix: string) {
  const s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.S3_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    }
  })

  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.R2_BUCKET_NAME!,
    Prefix: prefix
  })

  const response = await s3Client.send(listCommand)
  return response.Contents?.map((item) => item.Key).filter(Boolean) || []
}