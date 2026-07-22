// Basic API client function to provide authentication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

const throwApiError = async (response: Response): Promise<never> => {
    let message = `API Error: ${response.status}`;

    try {
        const body = await response.json();
        if (typeof body?.detail === "string") {
            message = body.detail;
        } else if (typeof body?.message === "string") {
            message = body.message;
        }
    } catch {
        // Keep the status-based fallback when the response has no JSON body.
    }

    throw new Error(message);
};

export const apiClient = {
    get: async (endpoint: string, token?: string | null) => {
        const headers: HeadersInit = {} 

        if(token) {
            headers["Authorization"] = `Bearer ${token}`
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers,
        });

        if(!response.ok) {
            return throwApiError(response);
        }

        return response.json();
    },

    post: async (endpoint: string, data: unknown, token?: string | null) => {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if(token) {
            headers["Authorization"] = `Bearer ${token}`
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            return throwApiError(response);
        }

        return response.json();
    },

    put: async (endpoint: string, data: unknown, token?: string | null) => {
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };

        if(token) {
            headers["Authorization"] = `Bearer ${token}`
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            return throwApiError(response);
        }

        return response.json();
    },

    delete: async (endpoint: string, token?: string | null) => {
        const headers: HeadersInit = {} 

        if(token) {
            headers["Authorization"] = `Bearer ${token}`
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers,
            method: "DELETE",
        });

        if(!response.ok) {
            return throwApiError(response);
        }

        return response.json();
    },

    uploadToS3: async (url: string, file: File) => {
        const response = await fetch(url, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type || "application/octet-stream" },
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return response;
    }
};
