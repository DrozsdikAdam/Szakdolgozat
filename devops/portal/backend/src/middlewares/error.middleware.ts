import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import type { ApiResponse } from "../dtos/common.dto.js";

export const errorHandler: ErrorRequestHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || "Internal Server Error";

    console.error(`[Error] ${req.method} ${req.path} - status: ${statusCode}:`, err);

    const response: ApiResponse<null> = {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
    };

    res.status(statusCode).json(response);
};
