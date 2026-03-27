/**
 * Google Drive Client Library
 *
 * Benötigte Env-Vars (in Coolify setzen):
 *   GOOGLE_SERVICE_ACCOUNT_JSON  → vollständiges Service-Account-JSON als String
 *   GDRIVE_AIOS_ROOT_FOLDER_ID   → ID des AIOS_Content Root-Ordners
 *   GDRIVE_IMAGES_FOLDER_ID      → ID von 04_Images/
 *   GDRIVE_AUDIO_FOLDER_ID       → ID von 05_Audio/
 *   GDRIVE_DRAFTS_FOLDER_ID      → ID von 03_Drafts/
 *
 * Google Drive Ordnerstruktur (manuell erstellen):
 *   AIOS_Content/
 *   ├── 01_Ideas/
 *   ├── 02_Research/
 *   ├── 03_Drafts/
 *   ├── 04_Images/
 *   ├── 05_Audio/
 *   ├── 06_Published/
 *   └── 07_Archive/
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  size?: string;
  createdTime?: string;
  parents?: string[];
}

// ── Token-Verwaltung via Service Account ──────────────────────────────────────

let _cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  // Refresh wenn < 60s verbleibend
  if (_cachedToken && _cachedToken.expiresAt > Date.now() + 60_000) {
    return _cachedToken.token;
  }

  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON nicht konfiguriert');

  const sa = JSON.parse(saJson) as {
    client_email: string;
    private_key: string;
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  // JWT signieren (RS256) — pure Web Crypto API, kein Node.js-spezifisch
  const header = { alg: 'RS256', typ: 'JWT' };
  const b64Header  = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const b64Payload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const sigInput   = `${b64Header}.${b64Payload}`;

  // PEM → CryptoKey importieren
  const pemKey = sa.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const keyBuf = Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyBuf,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const sigBuf  = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(sigInput));
  const b64Sig  = btoa(Array.from(new Uint8Array(sigBuf), (b) => String.fromCharCode(b)).join(''))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt     = `${sigInput}.${b64Sig}`;

  // Token-Exchange
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });
  if (!res.ok) throw new Error(`Google OAuth2 Fehler: ${res.status} ${await res.text()}`);

  const json = await res.json() as { access_token: string; expires_in: number };
  _cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return _cachedToken.token;
}

// ── Upload ────────────────────────────────────────────────────────────────────

/**
 * Lädt eine Datei in Google Drive hoch.
 * @param buffer   Dateiinhalt
 * @param fileName Dateiname (z.B. "image-xyz.jpg")
 * @param mimeType MIME-Type (z.B. "image/jpeg", "audio/mpeg")
 * @param folderId Google Drive Folder-ID
 */
export async function uploadToDrive(
  buffer: Buffer | ArrayBuffer | Uint8Array,
  fileName: string,
  mimeType: string,
  folderId: string
): Promise<DriveFile> {
  const token = await getAccessToken();

  const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
  const fileData  = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer instanceof ArrayBuffer ? buffer : buffer);

  // Multipart-Body aufbauen
  const boundary = `-------aios_upload_${Date.now()}`;
  const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`;
  const filePart = `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const endPart  = `\r\n--${boundary}--`;

  const enc   = new TextEncoder();
  const parts = [enc.encode(metaPart), enc.encode(filePart), fileData, enc.encode(endPart)];
  const total = parts.reduce((s, p) => s + p.byteLength, 0);
  const body  = new Uint8Array(total);
  let offset  = 0;
  for (const p of parts) { body.set(p, offset); offset += p.byteLength; }

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) throw new Error(`GDrive Upload Fehler: ${res.status} ${await res.text()}`);
  return res.json() as Promise<DriveFile>;
}

// ── Folder erstellen ──────────────────────────────────────────────────────────

export async function createDriveFolder(name: string, parentFolderId?: string): Promise<string> {
  const token = await getAccessToken();
  const metadata: Record<string, unknown> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) metadata.parents = [parentFolderId];

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) throw new Error(`GDrive Folder-Erstellung Fehler: ${res.status}`);
  const json = await res.json() as { id: string };
  return json.id;
}

// ── Files listen ──────────────────────────────────────────────────────────────

export async function listDriveFiles(folderId: string, pageSize = 100): Promise<DriveFile[]> {
  const token = await getAccessToken();
  const url   = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', `'${folderId}' in parents and trashed=false`);
  url.searchParams.set('fields', 'files(id,name,mimeType,webViewLink,webContentLink,size,createdTime)');
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set('orderBy', 'createdTime desc');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GDrive List Fehler: ${res.status}`);
  const json = await res.json() as { files: DriveFile[] };
  return json.files ?? [];
}

// ── Env-Var Helfer ────────────────────────────────────────────────────────────

export const gdriveConfig = {
  rootFolderId:     () => process.env.GDRIVE_AIOS_ROOT_FOLDER_ID ?? '',
  imagesFolderId:   () => process.env.GDRIVE_IMAGES_FOLDER_ID    ?? '',
  audioFolderId:    () => process.env.GDRIVE_AUDIO_FOLDER_ID     ?? '',
  draftsFolderId:   () => process.env.GDRIVE_DRAFTS_FOLDER_ID    ?? '',
  isConfigured:     () => !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
};
