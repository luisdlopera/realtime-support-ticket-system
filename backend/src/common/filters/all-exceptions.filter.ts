import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
  path: string;
  code?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProduction = process.env.NODE_ENV === "production";
    const isHttpException = exception instanceof HttpException;

    // Determinar status code
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Construir mensaje de error según el ambiente
    let message: string;
    let errorCode: string | undefined;

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const responseObj = exceptionResponse as { message?: string | string[]; error?: string };
        message = Array.isArray(responseObj.message)
          ? responseObj.message[0]
          : responseObj.message || "An error occurred";
      } else {
        message = "An error occurred";
      }
    } else {
      // Errores no HTTP
      if (exception instanceof Error) {
        message = isProduction ? "Internal server error" : exception.message;
        errorCode = this.generateErrorCode(exception);
      } else {
        message = "Internal server error";
      }
    }

    // Log detallado interno (siempre, independiente del ambiente)
    const error = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(
      `Error ${status} on ${request.method} ${request.path}: ${error.message}`,
      error.stack,
      {
        statusCode: status,
        path: request.path,
        method: request.method,
        timestamp: new Date().toISOString(),
        userAgent: request.headers["user-agent"],
        ip: request.ip,
        errorCode,
      }
    );

    // Respuesta al cliente
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.path,
    };

    // Solo incluir error code en producción para facilitar debugging con logs
    if (isProduction && errorCode) {
      errorResponse.code = errorCode;
    }

    // En desarrollo, incluir más detalles
    if (!isProduction && exception instanceof Error) {
      errorResponse.error = exception.message;
    }

    response.status(status).json(errorResponse);
  }

  private generateErrorCode(error: Error): string {
    // Generar un código único basado en el nombre del error y timestamp
    // para facilitar la búsqueda en logs
    const timestamp = Date.now().toString(36).slice(-6);
    const errorType = error.constructor.name.slice(0, 3).toUpperCase();
    return `${errorType}-${timestamp}`;
  }
}
