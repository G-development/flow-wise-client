import { supabase } from "./supabaseClient";
import { API_URL } from "./constants";

const FETCH_TIMEOUT_MS = 30000;

export async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<Response> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) throw new Error("No Supabase session found");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${authToken}`,
    };

    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
    }

    const hasBody = typeof options.body !== "undefined" && options.body !== null;
    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;
    if (hasBody && !isFormData && !("Content-Type" in headers)) {
      headers["Content-Type"] = "application/json";
    }

    return await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Request timeout after ${FETCH_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function buildQuery(
  params: Record<string, string | number | undefined>
): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      qs.append(key, String(value));
    }
  });
  const queryString = qs.toString();
  return queryString ? `?${queryString}` : "";
}
