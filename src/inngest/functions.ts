import { prismaDB } from "@/lib/prisma";
import { inngest } from "./client";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3"

export const processVideo = inngest.createFunction(
  {
    id: "process-video",
    retries: 1, // retries 2 times
    concurrency: {
      limit: 1,
      key: "event.data.userId"
    }
  },
  { event: "process-video-events" },
  async ({ event, step }) => {
    const { uploadedFileId, clipCount } = event.data

    try {
      const { userId, credits, s3Key } = await step.run("check-credits", async () => {
        const uploadedFile = await prismaDB.uploadedFile.findUniqueOrThrow({
          where: {
            id: uploadedFileId
          },
          select: {
            user: {
              select: {
                id: true,
                credits: true,
              }
            },
            s3Key: true,
          }
        })

        return {
          userId: uploadedFile.user.id,
          credits: uploadedFile.user.credits,
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

        await step.fetch(process.env.PROCESS_VIDEO_ENDPOINT!, {
            method: "POST",
            body: JSON.stringify({ s3_key: s3Key, clip_count: affordableClipCount }),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.PROCESS_VIDEO_ENDPOINT_AUTH}`
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
          await prismaDB.user.update({
            where: {
              id: userId
            },
            data: {
              credits: {
                decrement: clipsFound * 2
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
      console.error(error)
      await prismaDB.uploadedFile.update({
        where: {
          id: uploadedFileId,
        },
        data: {
          status: "failed"
        }
      })
    }
  },
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
    Bucket: process.env.R2_BUCKET_NAME,
    Prefix: prefix
  })

  const response = await s3Client.send(listCommand)
  return response.Contents?.map((item) => item.Key).filter(Boolean) || []
}