const BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
    public readonly status: number;
    public readonly errorData?: unknown;

    constructor(message: string, status: number, errorData?: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errorData = errorData;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

export const apiFetch = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = BASE_URL ? `${BASE_URL}/${cleanPath}` : `/${cleanPath}`;

    const mergedOptions: RequestInit = {
        credentials: "include",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers
        }
    };

    const response = await fetch(url, mergedOptions);

    const isAuthEndpoint = cleanPath.includes("api/auth/login") || cleanPath.includes("api/auth/refresh") || cleanPath.includes("api/auth/me");

    if ((response.status === 401 || response.status === 403) && !isAuthEndpoint) {
        const refreshUrl = BASE_URL ? `${BASE_URL}/api/auth/refresh` : `/api/auth/refresh`;
        const refreshResponse = await fetch(refreshUrl, {
            method: "POST",
            ...mergedOptions
        });

        if (refreshResponse.ok) {
            const retry = await fetch(url, mergedOptions);
            if (retry.ok) {
                return handleResponse(retry);
            }
        }
    }

    if (!response.ok) await throwError(response);

    return handleResponse(response);
};

const throwError = async (res: Response): Promise<never> => {
    const text = await res.text();
    let errorMessage = "Hiba történt a hálózati kérés során";
    let errorData: any = undefined;
    try {
        if (text) {
            errorData = JSON.parse(text);
            errorMessage = errorData.message || errorData.error || text;
        }
    } catch {
        errorMessage = text || errorMessage;
    }
    throw new ApiError(errorMessage, res.status, errorData);
};

const handleResponse = async <T>(res: Response): Promise<T> => {
    const text = await res.text();
    if (!text) return {} as T;
    try {
        return JSON.parse(text) as T;
    } catch {
        return { message: text } as unknown as T;
    }
};