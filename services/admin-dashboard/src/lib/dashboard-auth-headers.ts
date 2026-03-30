/**
 * Optional Bearer-Header für Browser-fetch() zu API-Routen mit verifyApiKey.
 * Wenn serverseitig DASHBOARD_API_KEY gesetzt ist, für same-origin Client-Calls
 * dieselbe Zeichenkette als NEXT_PUBLIC_DASHBOARD_API_KEY setzen — oder beide
 * weglassen und nur Edge-Auth (z. B. Authentik) nutzen.
 */
export function dashboardApiAuthHeaders(): Record<string, string> {
  const key = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY ?? "";
  if (!key) return {};
  return { Authorization: `Bearer ${key}` };
}
