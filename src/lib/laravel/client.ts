import { apiBaseUrl } from "@/lib/laravel/config";

/** Error from the Laravel API, carrying the HTTP status and Laravel's validation errors. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
  get isUnauthorized() {
    return this.status === 401;
  }
}

const FRIENDLY: Record<number, string> = {
  401: "Your session has expired. Please sign in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find that.",
  413: "That file is too large.",
  429: "Too many attempts. Please wait a moment and try again.",
};

/** Build an ApiError from a failed Laravel response body. */
export function toApiError(status: number, data: unknown): ApiError {
  const obj = (data && typeof data === "object" ? data : {}) as { message?: unknown; errors?: unknown };
  const fieldErrors: Record<string, string[]> = {};
  if (obj.errors && typeof obj.errors === "object") {
    for (const [k, v] of Object.entries(obj.errors as Record<string, unknown>)) {
      fieldErrors[k] = Array.isArray(v) ? v.map(String) : [String(v)];
    }
  }
  const laravelMessage = typeof obj.message === "string" && obj.message.trim() ? obj.message : null;
  let message: string;
  if (status === 422) message = laravelMessage ?? "Please fix the highlighted fields.";
  else if (status === 401) message = FRIENDLY[401]!;
  else if (status >= 500) message = "Something went wrong on our side. Please try again shortly.";
  else message = laravelMessage ?? FRIENDLY[status] ?? "The request could not be completed.";
  return new ApiError(message, status, fieldErrors);
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string | null;
  json?: unknown;
  formData?: FormData;
  /** Return the raw Response (file downloads). */
  raw?: boolean;
};

/**
 * Browser-side call to the Laravel API. Bearer-token auth only: `credentials: "omit"`
 * guarantees no cookies are sent (the API has supports_credentials=false).
 */
export async function laravel<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let body: BodyInit | undefined;
  if (opts.formData) body = opts.formData;
  else if (opts.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  }

  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl()}${path}`, {
      method: opts.method ?? (body ? "POST" : "GET"),
      headers,
      body,
      credentials: "omit",
      cache: "no-store",
    });
  } catch {
    throw new ApiError("We couldn't reach the CareerPrep service. Check your connection and try again.", 0);
  }

  if (opts.raw && res.ok) return res as T;
  if (res.status === 204) return null as T;

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) throw toApiError(res.status, data);
  return data as T;
}
