import { supabase } from "./supabaseClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

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

  const headers: HeadersInit = {
    ...(options.headers || {}),
    Authorization: `Bearer ${authToken}`,
  };

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
