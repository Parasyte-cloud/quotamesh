import "server-only";
import { cookies } from "next/headers";

const API_ORIGIN = process.env.QUOTAMESH_API_ORIGIN ?? "https://api.quotamesh.parasyte.cloud";

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!path.startsWith("/")) throw new TypeError("API path must be relative");

  const cookieStore = await cookies();
  const response = await fetch(`${API_ORIGIN}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      ...init.headers,
      cookie: cookieStore.toString(),
    },
  });

  if (!response.ok) {
    throw new Error(`QuotaMesh API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
