export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH: {
    MISSING_TOKEN: "Missing bearer token",
    INVALID_TOKEN: "Invalid token",
    INVALID_CREDENTIALS: "Invalid credentials",
    SESSION_EXPIRED: "Session expired. Please log in again.",
    NO_REFRESH_TOKEN: "No refresh token",
    TOKEN_REVOKED: "Token has been revoked",
    TOKEN_EXPIRED: "Token has expired",
    USER_NOT_FOUND: "User not found",
    INSUFFICIENT_PERMISSIONS: "Insufficient permissions",
  },

  // Validation errors
  VALIDATION: {
    INVALID_SIGNATURE: "Invalid signature",
    MISSING_APP_SECRET: "WHATSAPP_APP_SECRET is required in production",
    INVALID_OR_EXPIRED_TOKEN: "Invalid or expired token",
    PASSWORD_TOKEN_EXPIRED: "Token has expired",
  },

  // Resource errors
  RESOURCE: {
    TICKET_NOT_FOUND: "Ticket not found",
    USER_NOT_FOUND: "User not found",
    MESSAGE_NOT_FOUND: "Message not found",
    CONTACT_NOT_FOUND: "Contact not found",
  },

  // Rate limiting
  RATE_LIMIT: {
    TOO_MANY_ATTEMPTS: (minutes: number) =>
      `Too many login attempts. Please try again in ${minutes} minute(s).`,
    TOO_MANY_REQUESTS: "Too many requests. Please try again later.",
  },

  // WhatsApp errors
  WHATSAPP: {
    NOT_CONFIGURED: "WhatsApp not configured: missing PHONE_NUMBER_ID or ACCESS_TOKEN",
    SEND_FAILED: (error: string) => `WhatsApp send failed: ${error}`,
    MEDIA_INFO_FAILED: (error: string) => `Media info failed: ${error}`,
    NO_MEDIA_URL: "No media url",
    MEDIA_HEAD_FAILED: "Media HEAD request failed",
    MEDIA_DOWNLOAD_FAILED: "Media download failed",
    MEDIA_TOO_LARGE: (size: number, max: number) =>
      `Media file too large: ${size} bytes. Maximum allowed: ${max} bytes (50MB)`,
    SET_R2_PUBLIC_URL: "Set R2_PUBLIC_BASE_URL to send media to WhatsApp",
    MISSING_MEDIA_ID: "Media (missing id)",
    MEDIA_SETUP_REQUIRED: "Media (set R2 + WHATSAPP_ACCESS_TOKEN to store file)",
  },

  // Storage errors
  STORAGE: {
    R2_NOT_CONFIGURED:
      "R2 is not configured (set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)",
  },

  // Generic errors
  GENERIC: {
    INTERNAL_ERROR: "Internal server error",
    REQUEST_FAILED: "Request failed",
    UNAUTHORIZED: "Unauthorized",
    FORBIDDEN: "Forbidden",
  },
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
