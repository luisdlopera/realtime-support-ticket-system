import { HttpStatus } from "@nestjs/common";

/**
 * Standardized API Response Format
 * Used across all endpoints for consistent client-side handling
 *
 * Format: {
 *   success: boolean,
 *   data?: T,
 *   error?: ApiError,
 *   meta?: ApiMeta
 * }
 */

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  traceId?: string;
}

export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  pagination?: ApiPagination;
  [key: string]: unknown;
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta: ApiMeta;
}

/**
 * Creates a successful API response
 * @param data - The response data
 * @param meta - Additional metadata (pagination, etc.)
 */
export function createSuccessResponse<T>(
  data: T,
  meta: Omit<ApiMeta, "timestamp"> = {}
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Creates an error API response
 * @param code - Error code for client-side handling
 * @param message - Human-readable error message
 * @param details - Validation errors or additional context
 * @param traceId - Request ID for debugging
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: Record<string, string[]>,
  traceId?: string
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
      ...(traceId && { traceId }),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Predefined error codes for consistent client-side handling
 */
export const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: "AUTH_001",
  AUTH_TOKEN_EXPIRED: "AUTH_002",
  AUTH_TOKEN_INVALID: "AUTH_003",
  AUTH_MISSING_TOKEN: "AUTH_004",
  AUTH_INSUFFICIENT_PERMISSIONS: "AUTH_005",
  AUTH_ACCOUNT_LOCKED: "AUTH_006",

  // Validation
  VALIDATION_INVALID_INPUT: "VAL_001",
  VALIDATION_MISSING_FIELD: "VAL_002",
  VALIDATION_INVALID_FORMAT: "VAL_003",

  // Resources
  RESOURCE_NOT_FOUND: "RES_001",
  RESOURCE_ALREADY_EXISTS: "RES_002",
  RESOURCE_CONFLICT: "RES_003",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_001",

  // Server
  SERVER_INTERNAL_ERROR: "SRV_001",
  SERVER_SERVICE_UNAVAILABLE: "SRV_002",
  SERVER_TIMEOUT: "SRV_003",

  // External Services
  EXTERNAL_WHATSAPP_ERROR: "EXT_001",
  EXTERNAL_STORAGE_ERROR: "EXT_002",
  EXTERNAL_EMAIL_ERROR: "EXT_003",
} as const;

/**
 * HTTP Status to Error Code mapping
 */
export const STATUS_TO_ERROR_CODE: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: ERROR_CODES.VALIDATION_INVALID_INPUT,
  [HttpStatus.UNAUTHORIZED]: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
  [HttpStatus.FORBIDDEN]: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
  [HttpStatus.NOT_FOUND]: ERROR_CODES.RESOURCE_NOT_FOUND,
  [HttpStatus.CONFLICT]: ERROR_CODES.RESOURCE_CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: ERROR_CODES.RATE_LIMIT_EXCEEDED,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ERROR_CODES.SERVER_INTERNAL_ERROR,
  [HttpStatus.SERVICE_UNAVAILABLE]: ERROR_CODES.SERVER_SERVICE_UNAVAILABLE,
  [HttpStatus.GATEWAY_TIMEOUT]: ERROR_CODES.SERVER_TIMEOUT,
};

/**
 * Creates a paginated response
 * @param items - Array of items
 * @param total - Total count
 * @param page - Current page
 * @param limit - Items per page
 */
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): ApiResponse<T[]> {
  const totalPages = Math.ceil(total / limit);

  return createSuccessResponse(items, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}

/**
 * Creates a health check response
 */
export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  version: string;
  checks: Record<string, HealthCheckResult>;
}

export interface HealthCheckResult {
  status: "up" | "down" | "warning";
  responseTime?: number;
  message?: string;
}

export function createHealthResponse(
  status: HealthStatus["status"],
  checks: Record<string, HealthCheckResult>,
  version: string = process.env.npm_package_version || "1.0.0"
): ApiResponse<HealthStatus> {
  return createSuccessResponse({
    status,
    version,
    checks,
  });
}
