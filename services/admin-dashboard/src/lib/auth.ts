import { NextRequest } from "next/server";

/**
 * API-Key Authentifizierung.
 * Key wird als Bearer Token im Authorization-Header erwartet.
 * Setze DASHBOARD_API_KEY in den Coolify env vars.
 */
export function verifyApiKey(request: NextRequest): boolean {
  const apiKey = process.env.DASHBOARD_API_KEY;
  // Wenn kein Key gesetzt → offen (interne Nutzung, hinter Traefik-Auth)
  if (!apiKey) return true;

  // Bearer Token im Authorization-Header
  const authHeader = request.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token && timingSafeEqual(token, apiKey)) return true;
  }

  // Alternativ: X-API-Key Header (für Server-Side-Calls)
  const xKey = request.headers.get("x-api-key") ?? "";
  if (xKey && timingSafeEqual(xKey, apiKey)) return true;

  return false;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
