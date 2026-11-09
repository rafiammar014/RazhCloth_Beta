import { NextResponse } from "next/server";

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface ApiFieldError {
  field: string;
  message: string;
  code?: string;
}

export interface StandardApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    details?: ApiFieldError[];
  };
}

export class ApiResponse {
  static success<T>(data: T, status = 200, headers?: HeadersInit) {
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status, headers }
    );
  }

  static created<T>(data: T, location?: string) {
    const headers: HeadersInit = location ? { Location: location } : {};
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201, headers }
    );
  }

  static collection<T>(data: T[], meta: PaginationMeta, status = 200) {
    return NextResponse.json(
      {
        success: true,
        data,
        meta,
      },
      { status }
    );
  }

  static error(
    code: string,
    message: string,
    status = 400,
    details?: ApiFieldError[]
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code,
          message,
          ...(details && details.length > 0 ? { details } : {}),
        },
      },
      { status }
    );
  }

  static badRequest(message = "Bad Request", details?: ApiFieldError[]) {
    return this.error("BAD_REQUEST", message, 400, details);
  }

  static unauthorized(message = "Unauthorized - Authentication required") {
    return this.error("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "Forbidden - Insufficient permissions") {
    return this.error("FORBIDDEN", message, 403);
  }

  static notFound(message = "Resource not found") {
    return this.error("NOT_FOUND", message, 404);
  }

  static conflict(message = "Resource already exists or state conflict") {
    return this.error("CONFLICT", message, 409);
  }

  static unprocessable(message = "Validation failed", details?: ApiFieldError[]) {
    return this.error("VALIDATION_ERROR", message, 422, details);
  }

  static internal(message = "Internal Server Error") {
    return this.error("INTERNAL_ERROR", message, 500);
  }
}
