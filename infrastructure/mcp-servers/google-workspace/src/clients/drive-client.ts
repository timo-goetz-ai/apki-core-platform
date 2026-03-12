import { getDrive } from "../google-auth.js";
import { Readable } from "stream";

const drive = () => getDrive();

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

export async function listFiles(
  folderId?: string,
  query?: string,
  pageSize = 25
): Promise<DriveFile[]> {
  const parts: string[] = ["trashed = false"];
  if (folderId) parts.push(`'${folderId}' in parents`);
  if (query) parts.push(`name contains '${query}'`);

  const res = await drive().files.list({
    q: parts.join(" and "),
    pageSize,
    fields: "files(id,name,mimeType,parents,webViewLink,createdTime,modifiedTime,size)",
    orderBy: "modifiedTime desc",
  });

  return (res.data.files || []) as DriveFile[];
}

export async function createFolder(
  name: string,
  parentId?: string
): Promise<DriveFile> {
  const res = await drive().files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: parentId ? [parentId] : undefined,
    },
    fields: "id,name,mimeType,webViewLink",
  });
  return res.data as DriveFile;
}

export async function moveFile(
  fileId: string,
  newParentId: string
): Promise<DriveFile> {
  // Get current parents
  const file = await drive().files.get({
    fileId,
    fields: "parents",
  });
  const previousParents = (file.data.parents || []).join(",");

  const res = await drive().files.update({
    fileId,
    addParents: newParentId,
    removeParents: previousParents,
    fields: "id,name,mimeType,parents,webViewLink",
  });
  return res.data as DriveFile;
}

export async function uploadFile(
  name: string,
  content: string,
  mimeType: string,
  parentId?: string
): Promise<DriveFile> {
  const buf = Buffer.from(content, "base64");
  const stream = new Readable();
  stream.push(buf);
  stream.push(null);

  const res = await drive().files.create({
    requestBody: {
      name,
      parents: parentId ? [parentId] : undefined,
    },
    media: {
      mimeType,
      body: stream,
    },
    fields: "id,name,mimeType,webViewLink,size",
  });
  return res.data as DriveFile;
}

export async function downloadFile(fileId: string): Promise<string> {
  const res = await drive().files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" }
  );
  return Buffer.from(res.data as ArrayBuffer).toString("base64");
}

export async function deleteFile(fileId: string): Promise<void> {
  await drive().files.delete({ fileId });
}

export async function searchFiles(query: string, pageSize = 20): Promise<DriveFile[]> {
  const res = await drive().files.list({
    q: `fullText contains '${query}' and trashed = false`,
    pageSize,
    fields: "files(id,name,mimeType,parents,webViewLink,createdTime,modifiedTime,size)",
    orderBy: "modifiedTime desc",
  });
  return (res.data.files || []) as DriveFile[];
}

export async function getFileMetadata(fileId: string): Promise<DriveFile> {
  const res = await drive().files.get({
    fileId,
    fields: "id,name,mimeType,parents,webViewLink,createdTime,modifiedTime,size",
  });
  return res.data as DriveFile;
}

export async function createNestedFolders(
  pathParts: string[],
  rootParentId?: string
): Promise<DriveFile> {
  let parentId = rootParentId;
  let lastFolder: DriveFile | null = null;

  for (const part of pathParts) {
    // Check if folder already exists
    const existing = await listFiles(parentId, undefined, 100);
    const found = existing.find(
      (f) => f.name === part && f.mimeType === "application/vnd.google-apps.folder"
    );

    if (found) {
      lastFolder = found;
      parentId = found.id;
    } else {
      lastFolder = await createFolder(part, parentId);
      parentId = lastFolder.id;
    }
  }

  return lastFolder!;
}
