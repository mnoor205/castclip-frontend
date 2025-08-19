/**
 * Application constants
 * Centralized to avoid duplication and ensure consistency
 */

// YouTube API Configuration
export const YOUTUBE_API = {
  TIMEOUT_MS: 10000,
  MAX_RESULTS: 50,
  CHANNEL_ID_LENGTH: 24,
  CHANNEL_ID_PREFIX: 'UC',
  INPUT_MAX_LENGTH: 30,
} as const

// Timeouts and Limits
export const TIMEOUTS = {
  DATABASE_QUERY_MS: 5000,
  DATABASE_UPDATE_MS: 5000,
  YOUTUBE_API_MS: 10000,
} as const

// UI Constants
export const UI = {
  MODAL_SIZES: {
    SMALL: "sm:max-w-2xl",
    LARGE: "sm:max-w-4xl md:max-w-5xl lg:max-w-6xl",
  },
  CLIP_COUNT_OPTIONS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  MAX_RECENT_PROJECTS: 4,
} as const

// Error Messages
export const ERROR_MESSAGES = {
  YOUTUBE: {
    NO_API_KEY: "YouTube API key not configured",
    TIMEOUT: "YouTube service is currently unavailable. Please try again later.",
    CHANNEL_NOT_FOUND: "Channel not found. Please check the channel ID and try again.",
    INVALID_CHANNEL_ID: "Invalid channel ID. Please provide a valid YouTube channel ID starting with 'UC' followed by 22 characters.",
    VALIDATION_FAILED: "Unable to validate YouTube channel. Please try again later.",
    NO_CONNECTION: "No YouTube channel connected",
    EMPTY_INPUT: "Channel input cannot be empty",
  },
  AUTH: {
    NOT_AUTHENTICATED: "User not authenticated",
  },
  GENERAL: {
    DATABASE_TIMEOUT: "Database query timeout",
    DATABASE_UPDATE_TIMEOUT: "Database update timeout",
    UNKNOWN_ERROR: "An unknown error occurred",
  },
} as const

// Video Generation
export const VIDEO_GENERATION = {
  DEFAULT_CLIP_COUNT: 1,
  DEFAULT_CAPTION_STYLE: 1,
  CAPTION_STYLES: {
    CLASSIC: 1,
    EMOJI: 2,
    KARAOKE: 3,
  },
} as const

// YouTube Channel ID validation
export const YOUTUBE_VALIDATION = {
  CHANNEL_ID_REGEX: /^UC[a-zA-Z0-9_-]{22}$/,
  MAX_INPUT_LENGTH: 30,
} as const
