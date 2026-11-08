import type { Response } from "express";
import type { ApiResponse } from "../dtos/common.dto.js";

export function sendSuccess<T>(res: Response, data?: T, message?: string, statusCode = 200): void {
    const response: ApiResponse<T> = {
        success: true,
        ...(data !== undefined ? { data } : {}),
        ...(message ? { message } : {}),
        timestamp: new Date().toISOString()
    };
    res.status(statusCode).json(response);
}

export function sendError(res: Response, error: string, statusCode = 400): void {
    const response: ApiResponse<never> = {
        success: false,
        error,
        timestamp: new Date().toISOString()
    };
    res.status(statusCode).json(response);
}
