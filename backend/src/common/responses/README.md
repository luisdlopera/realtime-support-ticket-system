# API Response Format

This module provides a standardized response format for all API endpoints.

## Format

All API responses follow this structure:

```json
{
  "success": boolean,
  "data": T | null,
  "error": {
    "code": string,
    "message": string,
    "details": object | undefined,
    "traceId": string | undefined
  } | undefined,
  "meta": {
    "timestamp": string (ISO 8601),
    "requestId": string | undefined,
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "totalPages": number,
      "hasNext": boolean,
      "hasPrev": boolean
    } | undefined
  }
}
```

## Success Response Example

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "requestId": "abc123-def456"
  }
}
```

## Error Response Example

```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials",
    "traceId": "abc123-def456"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| AUTH_001 | Invalid credentials |
| AUTH_002 | Token expired |
| AUTH_003 | Token invalid |
| AUTH_004 | Missing token |
| AUTH_005 | Insufficient permissions |
| VAL_001 | Invalid input |
| VAL_002 | Missing field |
| RES_001 | Resource not found |
| RES_002 | Resource already exists |
| RATE_001 | Rate limit exceeded |
| SRV_001 | Internal server error |
| EXT_001 | WhatsApp error |
| EXT_002 | Storage error |

## Usage in Controllers

The ResponseInterceptor automatically formats all responses. You don't need to do anything special:

```typescript
@Controller('tickets')
export class TicketsController {
  @Get()
  async list() {
    // Automatically wrapped in standard format
    return this.ticketService.findAll();
  }
}
```

## Manual Usage (if needed)

```typescript
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from './api-response';

// Success response
return createSuccessResponse(data);

// Error response
return createErrorResponse('AUTH_001', 'Invalid credentials');

// Paginated response
return createPaginatedResponse(items, total, page, limit);
```

## Health Check Response

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "checks": {
      "database": { "status": "up", "responseTime": 12 },
      "redis": { "status": "up", "responseTime": 5 },
      "memory": { "status": "up", "message": "Heap: 45MB" }
    }
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```
