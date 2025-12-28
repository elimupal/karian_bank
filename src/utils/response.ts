/**
 * Standard API Response format
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    error?: ErrorResponse;
    metadata?: ResponseMetadata;
}

/**
 * Error Response format (RFC 7807 Problem Details)
 */
export interface ErrorResponse {
    code?: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
}

/**
 * Response Metadata (pagination, etc.)
 */
export interface ResponseMetadata {
    pagination?: PaginationMetadata;
    timestamp?: string;
    requestId?: string;
}

/**
 * Pagination Metadata
 */
export interface PaginationMetadata {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

/**
 * Success Response Helper
 */
export const successResponse = <T>(
    data?: T,
    message?: string,
    metadata?: ResponseMetadata
): ApiResponse<T> => {
    return {
        success: true,
        message,
        data,
        metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
        },
    };
};

/**
 * Error Response Helper
 */
export const errorResponse = (
    message: string,
    code?: string,
    details?: Record<string, unknown>,
    stack?: string
): ApiResponse => {
    return {
        success: false,
        error: {
            message,
            code,
            details,
            stack: process.env.NODE_ENV === 'development' ? stack : undefined,
        },
        metadata: {
            timestamp: new Date().toISOString(),
        },
    };
};

/**
 * Paginated Response Helper
 */
export const paginatedResponse = <T>(
    data: T[],
    page: number,
    pageSize: number,
    totalItems: number,
    message?: string
): ApiResponse<T[]> => {
    const totalPages = Math.ceil(totalItems / pageSize);

    return successResponse(data, message, {
        pagination: {
            page,
            pageSize,
            totalPages,
            totalItems,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
        },
    });
};
