import { supabase } from "./supabaseClient";
import { API_URL } from "./constants";

export async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// Helper for bank API calls that use a different token (GoCardless accessToken)
export async function bankApiFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
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
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (hasBody && !isFormData && !("Content-Type" in headers)) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${API_URL}${path}`, { ...options, headers });
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<Response> {
  const authToken = token ?? (await getAuthToken());
  if (!authToken) throw new Error("No Supabase session found");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${authToken}`,
  };

  // Merge existing headers (handle both object and Headers instance)
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  // Imposta Content-Type JSON automaticamente se è presente un body non-FormData
  const hasBody = typeof options.body !== "undefined" && options.body !== null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (hasBody && !isFormData && !("Content-Type" in headers)) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${API_URL}${path}`, { ...options, headers });
}

export function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}
