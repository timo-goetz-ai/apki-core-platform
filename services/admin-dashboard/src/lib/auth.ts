import { NextRequest } from "next/server";

/**
 * API-Key Authentifizierung.
 * Key wird als Bearer Token im Authorization-Header erwartet.
 * Setze DASHBOARD_API_KEY in den Coolify env vars.
 */
export function verifyApiKey(request: NextRequest): boolean {
  const apiKey = process.env.DASHBOARD_API_KEY;
  if (!apiKey) {
    console.warn("DASHBOARD_API_KEY ist nicht gesetzt – API ist ungeschützt!");
    return false;
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return false;

  const token = authHeader.slice(7).trim();
  // Constant-time comparison um Timing-Attacks zu verhindern
  return timingSafeEqual(token, apiKey);
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
