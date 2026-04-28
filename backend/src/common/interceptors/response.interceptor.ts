import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
  HttpException,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { Request, Response } from "express";
import {
  createSuccessResponse,
  createErrorResponse,
  ERROR_CODES,
  STATUS_TO_ERROR_CODE,
  ApiResponse,
} from "../responses/api-response";
import { ERROR_MESSAGES } from "../constants/error-messages.constants";

/**
 * Global Response Interceptor
 *
 * Standardizes all API responses to follow a consistent format:
 * {
 *   success: boolean,
 *   data?: any,
 *   error?: { code, message, details?, traceId? },
 *   meta: { timestamp, requestId?, pagination? }
 * }
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse | null> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Generate request ID for tracing
    const requestId = this.generateRequestId();
    request.headers["x-request-id"] = requestId;

    return next.handle().pipe(
      map((data): ApiResponse | null => {
        // If already formatted, return as-is
        if (this.isApiResponse(data)) {
          return data;
        }

        // Handle null/undefined responses (204 No Content)
        if (data === null || data === undefined) {
          response.status(HttpStatus.NO_CONTENT);
          return null;
        }

        // Handle pagination metadata if present
        if (data && typeof data === "object" && "items" in data && "meta" in data) {
          return createSuccessResponse(data.items, {
            ...data.meta,
            requestId,
          });
        }

        // Standard success response
        return createSuccessResponse(data, { requestId });
      }),
      catchError((error) => {
        const formattedError = this.formatError(error, requestId);

        // Set appropriate status code
        const statusCode = this.getStatusCode(error);
        response.status(statusCode);

        return throwError(() => formattedError);
      })
    );
  }

  private isApiResponse(data: unknown): data is ApiResponse {
    return (
      typeof data === "object" &&
      data !== null &&
      "success" in data &&
      typeof (data as ApiResponse).success === "boolean" &&
      "meta" in data
    );
  }

  private formatError(error: unknown, requestId: string): HttpException {
    // Already an HttpException
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const errorResponse = error.getResponse();

      let message: string;
      let details: Record<string, string[]> | undefined;

      if (typeof errorResponse === "string") {
        message = errorResponse;
      } else if (typeof errorResponse === "object" && errorResponse !== null) {
        const response = errorResponse as Record<string, unknown>;
        message = (response.message as string) || ERROR_MESSAGES.GENERIC.INTERNAL_ERROR;
        if (response.errors) {
          details = response.errors as Record<string, string[]>;
        }
      } else {
        message = ERROR_MESSAGES.GENERIC.INTERNAL_ERROR;
      }

      const code = STATUS_TO_ERROR_CODE[status] || ERROR_CODES.SERVER_INTERNAL_ERROR;
      const formattedResponse = createErrorResponse(code, message, details, requestId);

      return new HttpException(formattedResponse, status);
    }

    // Unknown error - don't leak details in production
    const isProduction = process.env.NODE_ENV === "production";
    const message = isProduction
      ? ERROR_MESSAGES.GENERIC.INTERNAL_ERROR
      : error instanceof Error
        ? error.message
        : String(error);

    const code = ERROR_CODES.SERVER_INTERNAL_ERROR;
    const formattedResponse = createErrorResponse(code, message, undefined, requestId);

    return new HttpException(formattedResponse, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  private getStatusCode(error: unknown): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }
}
