// Basic API client function to provide authentication
const API_BASE_URL = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "http://localhost:8000"

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
            throw new Error(`API Error: ${response.status}`)
        }

        return response.json()
    }
}