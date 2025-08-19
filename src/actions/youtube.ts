"use server"

import { auth } from "@/lib/auth"
import { prismaDB } from "@/lib/prisma"
import { google } from "googleapis"
import { headers } from "next/headers"
import type { Video, YouTubeChannel, YouTubeResponse, YouTubeSearchResponse } from "@/lib/types"
import { TIMEOUTS, ERROR_MESSAGES, YOUTUBE_VALIDATION } from "@/lib/constants"

// ==========================================
// OAUTH IMPLEMENTATION (COMMENTED OUT)
// ==========================================
// Keeping this for potential future use if we get OAuth approval

/*
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
*/

// ==========================================
// MANUAL CHANNEL ID IMPLEMENTATION
// ==========================================

// Use centralized type instead of local interface
type YouTubeChannelInfo = YouTubeChannel

/**
 * Validates channel ID input (only accepts direct channel IDs)
 * Only supports direct channel IDs for security
 */
function extractChannelIdFromInput(input: string): string | null {
  const cleanInput = input.trim()
  
  // Security: Reject inputs that are too long
  if (cleanInput.length > YOUTUBE_VALIDATION.MAX_INPUT_LENGTH) {
    return null
  }
  
  // Only accept direct channel ID (UC... format)
  if (YOUTUBE_VALIDATION.CHANNEL_ID_REGEX.test(cleanInput)) {
    return cleanInput
  }
  
  return null
}

/**
 * Validates that a channel ID exists and gets basic channel information
 */
async function validateAndGetChannelInfo(channelId: string): Promise<YouTubeChannelInfo> {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error(ERROR_MESSAGES.YOUTUBE.NO_API_KEY)
  }
  
  const youtube = google.youtube({ 
    version: "v3", 
    auth: process.env.YOUTUBE_API_KEY 
  })
  
  try {
    // Add timeout to YouTube API call
    const channelsResponse = await Promise.race([
      youtube.channels.list({
        part: ["snippet", "statistics"],
        id: [channelId],
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(ERROR_MESSAGES.YOUTUBE.TIMEOUT)), TIMEOUTS.YOUTUBE_API_MS)
      )
    ])
    
    const channel = channelsResponse.data.items?.[0]
    if (!channel) {
      throw new Error(ERROR_MESSAGES.YOUTUBE.CHANNEL_NOT_FOUND)
    }
    
    // Validate required fields
    if (!channel.id) {
      throw new Error("Invalid channel data received")
    }
    
    return {
      channelId: channel.id,
      channelTitle: channel.snippet?.title || "Unknown Channel",
      channelHandle: channel.snippet?.customUrl || undefined,
      subscriberCount: channel.statistics?.subscriberCount || undefined,
      videoCount: channel.statistics?.videoCount || undefined,
      thumbnailUrl: channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url || undefined,
    }
  } catch (error) {
    console.error("Failed to validate channel:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      channelId,
      timestamp: new Date().toISOString(),
    })
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error("YouTube service is currently unavailable. Please try again later.")
      }
      if (error.message.includes('not found')) {
        throw new Error("Channel not found. Please check the channel ID and try again.")
      }
    }
    
    throw new Error("Unable to validate YouTube channel. Please try again later.")
  }
}

/**
 * Gets YouTube client with public API key
 */
function getPublicYouTubeClient() {
  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error("YouTube API key not configured")
  }
  
  return google.youtube({ 
    version: "v3", 
    auth: process.env.YOUTUBE_API_KEY 
  })
}

/**
 * Gets user's connected YouTube channel info from database (internal function)
 */
async function getUserYouTubeChannelInternal(): Promise<{ channelId: string; channelTitle: string } | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.id) {
      throw new Error("User not authenticated")
    }
    
    // Add timeout to database query
    const user = await Promise.race([
      prismaDB.user.findUnique({
        where: { id: session.user.id },
        select: { youtubeChannelId: true, youtubeChannelTitle: true }
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
    ])
    
    if (!user?.youtubeChannelId) {
      return null
    }
    
    return {
      channelId: user.youtubeChannelId,
      channelTitle: user.youtubeChannelTitle || "Unknown Channel"
    }
  } catch (error: unknown) {
    console.error("Failed to get user YouTube channel:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    
    if (error instanceof Error && error.message === "User not authenticated") {
      throw error
    }
    
    // Return null for other errors to indicate no connection
    return null
  }
}

/**
 * Gets user's connected YouTube channel info from database (public function)
 */
export async function getUserYouTubeChannel(): Promise<Pick<YouTubeChannel, 'channelId' | 'channelTitle'> | null> {
  return await getUserYouTubeChannelInternal()
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

// ==========================================
// OLD OAUTH FUNCTIONS (COMMENTED OUT)
// ==========================================

/*
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
*/

// ==========================================
// NEW PUBLIC API FUNCTIONS
// ==========================================

/**
 * Validates a YouTube channel ID without connecting it
 */
export async function validateYouTubeChannel(input: string): Promise<YouTubeChannel> {
  try {
    // Validate and sanitize input
    const trimmedInput = input.trim()
    if (!trimmedInput) {
      throw new Error(ERROR_MESSAGES.YOUTUBE.EMPTY_INPUT)
    }
    
    // Validate channel ID
    const channelId = extractChannelIdFromInput(trimmedInput)
    if (!channelId) {
      throw new Error(ERROR_MESSAGES.YOUTUBE.INVALID_CHANNEL_ID)
    }
    
    // Just validate and return channel info, don't save to database
    const channelInfo = await validateAndGetChannelInfo(channelId)
    return channelInfo
  } catch (error: unknown) {
    console.error("Failed to validate YouTube channel:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      input: input?.substring(0, 50), // Log partial input for debugging (security safe)
      timestamp: new Date().toISOString(),
    })
    
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to validate YouTube channel")
  }
}

/**
 * Connects a YouTube channel by manual input (URL, handle, or channel ID)
 */
export async function connectYouTubeChannel(channelInfo: YouTubeChannel): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session?.user?.id) {
      throw new Error(ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED)
    }
    
    // Save to database with timeout
    await Promise.race([
      prismaDB.user.update({
        where: { id: session.user.id },
        data: {
          youtubeChannelId: channelInfo.channelId,
          youtubeChannelTitle: channelInfo.channelTitle,
        }
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(ERROR_MESSAGES.GENERAL.DATABASE_UPDATE_TIMEOUT)), TIMEOUTS.DATABASE_UPDATE_MS)
      )
    ])
  } catch (error: unknown) {
    console.error("Failed to connect YouTube channel:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      channelId: channelInfo.channelId,
      timestamp: new Date().toISOString(),
    })
    
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to connect YouTube channel")
  }
}

/**
 * Disconnects the YouTube channel
 */
export async function disconnectYouTubeChannel(): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated")
  }
  
  await prismaDB.user.update({
    where: { id: session.user.id },
    data: {
      youtubeChannelId: null,
      youtubeChannelTitle: null,
    }
  })
}

/**
 * Gets YouTube videos from the user's connected channel
 */
export async function getYouTubeVideos(pageToken?: string): Promise<YouTubeResponse> {
  try {
    // Get user's connected channel
    const channelInfo = await getUserYouTubeChannelInternal()
    if (!channelInfo) {
      return { connected: false, videos: [], nextPageToken: null }
    }
    
    const result = await getYouTubeVideosByChannelId(channelInfo.channelId, pageToken)
    return { ...result, connected: true }
  } catch (error: unknown) {
    console.error("Failed to fetch YouTube videos:", error)
    throw error
  }
}

/**
 * Gets YouTube videos from a specific channel ID
 */
export async function getYouTubeVideosByChannelId(channelId: string, pageToken?: string): Promise<Omit<YouTubeResponse, 'connected'>> {
  try {
    if (!channelId) {
      throw new Error("Channel ID is required")
    }
    
    const youtube = getPublicYouTubeClient()
    
    // Get the uploads playlist ID from the channel with timeout
    const channelsResponse = await Promise.race([
      youtube.channels.list({
        part: ["contentDetails"],
        id: [channelId],
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(ERROR_MESSAGES.YOUTUBE.TIMEOUT)), TIMEOUTS.YOUTUBE_API_MS)
      )
    ])

    const uploadsPlaylistId = channelsResponse.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!uploadsPlaylistId) {
      return { videos: [], nextPageToken: null }
    }

    // Get videos from the uploads playlist with timeout
    const videosResponse = await Promise.race([
      youtube.playlistItems.list({
        part: ["snippet"],
        playlistId: uploadsPlaylistId,
        maxResults: 50,
        pageToken: pageToken,
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(ERROR_MESSAGES.YOUTUBE.TIMEOUT)), TIMEOUTS.YOUTUBE_API_MS)
      )
    ])

    const allVideos =
      videosResponse.data.items?.map((item) => ({
        id: item.snippet?.resourceId?.videoId || "",
        title: item.snippet?.title || "Untitled",
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      })).filter(video => video.id) ?? [] // Filter out videos without IDs

    // Filter to only show long-form videos (not shorts)
    const longFormVideoIds = await filterPublicLongFormVideos(youtube, allVideos.map((v) => v.id))
    const videos = allVideos.filter((v) => longFormVideoIds.includes(v.id))

    return {
      videos,
      nextPageToken: videosResponse.data.nextPageToken || null,
    }
  } catch (error: unknown) {
    console.error("Failed to fetch YouTube videos:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      channelId,
      pageToken,
      timestamp: new Date().toISOString(),
    })
    
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error("YouTube service is currently unavailable. Please try again later.")
    }
    
    throw new Error("Failed to fetch videos. Please try again later.")
  }
}

/**
 * Searches YouTube videos from the user's connected channel
 */
export async function searchYouTubeVideos(query: string, pageToken?: string): Promise<YouTubeSearchResponse> {
  try {
    const channelInfo = await getUserYouTubeChannelInternal()
    if (!channelInfo) {
      throw new Error("No YouTube channel connected")
    }
    
    return await searchYouTubeVideosByChannelId(channelInfo.channelId, query, pageToken)
  } catch (error: unknown) {
    console.error("Failed to search YouTube videos:", error)
    throw error
  }
}

/**
 * Searches YouTube videos from a specific channel ID
 */
export async function searchYouTubeVideosByChannelId(channelId: string, query: string, pageToken?: string): Promise<YouTubeSearchResponse> {
  try {
    const youtube = getPublicYouTubeClient()

    const searchResponse = await youtube.search.list({
      part: ["snippet"],
      channelId: channelId,
      q: query,
      type: ["video"],
      maxResults: 50,
      pageToken: pageToken,
    })

    const allVideos =
      searchResponse.data.items?.map((item) => ({
        id: item.id?.videoId || "",
        title: item.snippet?.title || "Untitled",
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
      })) ?? []

    // Filter to only show long-form videos (not shorts)
    const longFormVideoIds = await filterPublicLongFormVideos(youtube, allVideos.map((v) => v.id))
    const videos = allVideos.filter((v) => longFormVideoIds.includes(v.id))

    return {
      videos,
      nextPageToken: searchResponse.data.nextPageToken || null,
    }
  } catch (error: unknown) {
    console.error("Failed to search YouTube videos:", error)
    throw error
  }
}

/*
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
*/

/**
 * Gets details for a specific YouTube video (public API)
 */
export async function getYouTubeVideoDetails(videoId: string): Promise<Video> {
  try {
    const youtube = getPublicYouTubeClient()

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
    throw error
  }
}
