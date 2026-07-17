export const apiFetch = async <T>(path: string, options?: RequestInit): Promise<T> => {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const url = `http://localhost:8080/${cleanPath}`;

    const mergedOptions: RequestInit = {
        credentials: "include",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options?.headers
        }
    };

    const response = await fetch(url, mergedOptions);

    if (response.status === 401) {
        const refreshResponse = await fetch(`http://localhost:8080/api/auth/refresh`, {
            method: "POST",
            ...mergedOptions
        });

        if (!refreshResponse.ok) await throwError(refreshResponse);

        const retry = await fetch(url, mergedOptions);

        if (!retry.ok) await throwError(retry);

        return handleResponse(retry);
    }

    if (!response.ok) await throwError(response);

    return handleResponse(response);
};

const throwError = async (res: Response): Promise<never> => {
    const text = await res.text();
    let errorMessage = "Hiba történt a hálózati kérés során";
    try {
        if (text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorData.error || text;
        }
    } catch (e) {
        errorMessage = text || errorMessage;
    }
    throw new Error(errorMessage);
};

const handleResponse = async <T>(res: Response): Promise<T> => {
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
};