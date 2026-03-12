import { google } from "googleapis";
import { GoogleAuth, JWT } from "google-auth-library";
import * as path from "path";
import * as fs from "fs";

// All scopes needed for full Workspace + Cloud access
const SCOPES = [
  // Drive
  "https://www.googleapis.com/auth/drive",
  // Sheets
  "https://www.googleapis.com/auth/spreadsheets",
  // Calendar
  "https://www.googleapis.com/auth/calendar",
  // Slides
  "https://www.googleapis.com/auth/presentations",
  // Forms
  "https://www.googleapis.com/auth/forms.body",
  "https://www.googleapis.com/auth/forms.responses.readonly",
  // IAM
  "https://www.googleapis.com/auth/cloud-platform",
  "https://www.googleapis.com/auth/iam",
];

let cachedAuth: JWT | null = null;

export function getAuth(): JWT {
  if (cachedAuth) return cachedAuth;

  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyPath) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS not set");
  }

  const resolvedPath = path.resolve(keyPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Service account key not found: ${resolvedPath}`);
  }

  const keyFile = JSON.parse(fs.readFileSync(resolvedPath, "utf-8"));
  const delegatedUser = process.env.GOOGLE_DELEGATED_USER;

  if (!delegatedUser) {
    throw new Error("GOOGLE_DELEGATED_USER not set - required for Workspace API access");
  }

  cachedAuth = new JWT({
    email: keyFile.client_email,
    key: keyFile.private_key,
    scopes: SCOPES,
    subject: delegatedUser, // Domain-wide delegation impersonation
  });

  return cachedAuth;
}

// For IAM/Cloud APIs that don't need delegation
export function getCloudAuth(): GoogleAuth {
  return new GoogleAuth({
    keyFile: path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS || ""),
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
}

export function getDrive() {
  return google.drive({ version: "v3", auth: getAuth() });
}

export function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export function getCalendar() {
  return google.calendar({ version: "v3", auth: getAuth() });
}

export function getSlides() {
  return google.slides({ version: "v1", auth: getAuth() });
}

export function getForms() {
  return google.forms({ version: "v1", auth: getAuth() });
}

export function getIAM() {
  return google.iam({ version: "v1", auth: getCloudAuth() });
}

export function getCloudResourceManager() {
  return google.cloudresourcemanager({ version: "v1", auth: getCloudAuth() });
}

export function getServiceUsage() {
  return google.serviceusage({ version: "v1", auth: getCloudAuth() });
}
