"use server"

import { auth } from "@/lib/auth"
import { prismaDB } from "@/lib/prisma"
import { google } from "googleapis"
import { headers } from "next/headers"

async function getYouTubeOauthClient() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user?.id) {
    throw new Error("User not authenticated")
  }

  const userId = session.user.id
  const account = await prismaDB.account.findFirst({
    where: {
      userId,
      providerId: "google",
    },
  })

  if (!account) {
    throw new Error("YouTube account not connected")
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
  })

  // If the token is expired, refresh it and update the database
  if (account.accessTokenExpiresAt && new Date() > account.accessTokenExpiresAt) {
    if (account.refreshToken) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken()
        const { access_token, expiry_date, refresh_token } = credentials

        await prismaDB.account.update({
          where: { id: account.id },
          data: {
            accessToken: access_token,
            accessTokenExpiresAt: expiry_date ? new Date(expiry_date as number) : null,
            // Google might return a new refresh token, so we save it if present
            refreshToken: refresh_token ?? account.refreshToken,
          },
        })

        oauth2Client.setCredentials(credentials)
      } catch (error) {
        console.error("Failed to refresh YouTube access token:", error)
        throw new Error("Could not refresh YouTube access token")
      }
    } else {
      throw new Error("No refresh token available and access token is expired")
    }
  }

  return oauth2Client
}

async function filterPublicLongFormVideos(youtube: ReturnType<typeof google.youtube>, videoIds: string[]) {
  if (videoIds.length === 0) return []

  const videoDetailsResponse = await youtube.videos.list({
    part: ["contentDetails", "status"],
    id: videoIds,
  })

  const validVideoIds = new Set(
    videoDetailsResponse.data.items
      ?.filter((item) => {
        const isPublic = item.status?.privacyStatus === "public"
        if (!isPublic) return false

        const duration = item.contentDetails?.duration
        if (!duration) return false // Exclude videos without duration
        // PT1M or PT1M0S means 1 minute. Anything less is a short.
        // Formats like PT3M2S, PT1H, etc., are longer.
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
        if (!match) return true // Keep if format is weird, to be safe
        const hours = parseInt(match[1] || "0")
        const minutes = parseInt(match[2] || "0")
        if (hours > 0 || minutes > 0) return true
        return false
      })
      .map((item) => item.id)
  )

  return videoIds.filter((id) => validVideoIds.has(id))
}

export async function getYouTubeVideos(pageToken?: string) {
  try {
    const oauth2Client = await getYouTubeOauthClient()
    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    // First, get the uploads playlist ID from the channel
    const channelsResponse = await youtube.channels.list({
      part: ["contentDetails"],
      mine: true,
    })

    const uploadsPlaylistId = channelsResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!uploadsPlaylistId) {
      // This can happen if the channel has no public videos or is brand new.
      return { connected: true, videos: [], nextPageToken: null }
    }

    // Then, get the videos from that playlist
    const videosResponse = await youtube.playlistItems.list({
      part: ["snippet"],
      playlistId: uploadsPlaylistId,
      maxResults: 50, // Max allowed by API
      pageToken: pageToken,
    })

    const allVideos =
      videosResponse.data.items?.map((item) => ({
        id: item.snippet?.resourceId?.videoId || "",
        title: item.snippet?.title || "Untitled",
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      })) ?? []

      
    const longFormVideoIds = await filterPublicLongFormVideos(
      youtube,
      allVideos.map((v) => v.id)
    )
    const videos = allVideos.filter((v) => longFormVideoIds.includes(v.id))

    return {
      connected: true,
      videos,
      nextPageToken: videosResponse.data.nextPageToken,
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "YouTube account not connected") {
      return { connected: false, videos: [], nextPageToken: null }
    }
    console.error("Failed to fetch YouTube videos:", error)
    // Re-throw other errors to be handled by the caller
    throw error
  }
}

export async function searchYouTubeVideos(query: string, pageToken?: string) {
  try {
    const oauth2Client = await getYouTubeOauthClient()
    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    const searchResponse = await youtube.search.list({
      part: ["snippet"],
      forMine: true, // This is key to searching only the user's videos
      q: query,
      type: ["video"],
      maxResults: 50, // Max allowed by API
      pageToken: pageToken,
    })

    const allVideos =
      searchResponse.data.items?.map((item) => ({
        id: item.id?.videoId || "",
        title: item.snippet?.title || "Untitled",
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      })) ?? []

    const longFormVideoIds = await filterPublicLongFormVideos(
      youtube,
      allVideos.map((v) => v.id)
    )
    const videos = allVideos.filter((v) => longFormVideoIds.includes(v.id))

    return {
      videos,
      nextPageToken: searchResponse.data.nextPageToken,
    }
  } catch (error: unknown) {
    console.error("Failed to search YouTube videos:", error)
    // Re-throw other errors to be handled by the caller
    throw error
  }
}

export async function getYouTubeVideoDetails(videoId: string) {
  try {
    const oauth2Client = await getYouTubeOauthClient()
    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    const videoResponse = await youtube.videos.list({
      part: ["snippet"],
      id: [videoId],
    })

    const video = videoResponse.data.items?.[0]

    if (!video) {
      throw new Error("Video not found")
    }

    return {
      id: video.id || "",
      title: video.snippet?.title || "Untitled",
      thumbnailUrl: video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url || "",
    }
  } catch (error: unknown) {
    console.error("Failed to fetch YouTube video details:", error)
    // Re-throw other errors to be handled by the caller
    throw error
  }
}
