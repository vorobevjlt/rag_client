const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

// Basic API Client function with authentication support

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const throwApiError = async (response: Response): Promise<never> => {
  let message = `API Error: ${response.status}`;

  try {
    const body = await response.json();

    if (typeof body?.detail === "string") {
      message = body.detail;
    } else if (Array.isArray(body?.detail)) {
      message =
        body.detail
          .map((item: { msg?: string }) => item?.msg)
          .filter(Boolean)
          .join("; ") || message;
    } else if (typeof body?.message === "string") {
      message = body.message;
    }
  } catch {
    // Keep the status-based fallback when the response has no JSON body.
  }

  throw new ApiError(message, response.status);
};

export const apiClient = {
  get: async (endpoint: string, token?: string | null) => {
    const headers: HeadersInit = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
    });

    if (!response.ok) {
      return throwApiError(response);
    }

    return response.json();
  },

  post: async (
    endpoint: string,
    data: unknown,
    token?: string | null,
    signal?: AbortSignal
  ) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      signal,
    });

    if (!response.ok) {
      return throwApiError(response);
    }

    return response.json();
  },

  delete: async (endpoint: string, token?: string | null) => {
    const headers: HeadersInit = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      method: "DELETE",
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

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
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
  uploadToS3: async (
    url: string,
    file: File,
    contentType: string,
    onProgress: (percent: number) => void,
    signal: AbortSignal
  ) => {
    await new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      const cleanUp = () => signal.removeEventListener("abort", abortUpload);
      const abortUpload = () => request.abort();

      request.open("PUT", url);
      request.setRequestHeader("Content-Type", contentType);
      request.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      request.onload = () => {
        cleanUp();
        if (request.status >= 200 && request.status < 300) {
          onProgress(100);
          resolve();
          return;
        }
        reject(new Error(`S3 Upload Error: ${request.status}`));
      };
      request.onerror = () => {
        cleanUp();
        reject(new Error("S3 upload failed because of a network error"));
      };
      request.onabort = () => {
        cleanUp();
        reject(new DOMException("Upload cancelled", "AbortError"));
      };

      if (signal.aborted) {
        cleanUp();
        reject(new DOMException("Upload cancelled", "AbortError"));
        return;
      }
      signal.addEventListener("abort", abortUpload, { once: true });
      request.send(file);
    });
  },
};
