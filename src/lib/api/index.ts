// Basic API client function to provide authentication
const CLERK_API_BASE_URL = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

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
            throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
    },

    post: async (endpoint: string, data: any ,token?: string | null) => {
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
            throw new Error(`API Error: ${response.status}`);
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
            throw new Error(`API Error: ${response.status}`);
        }

        return response.json();
    }
};
