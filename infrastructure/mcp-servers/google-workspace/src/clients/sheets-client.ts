import { getSheets, getDrive } from "../google-auth.js";

const sheets = () => getSheets();
const drive = () => getDrive();

export interface SpreadsheetInfo {
  id: string;
  title: string;
  url: string;
  sheetNames: string[];
}

export async function createSpreadsheet(
  title: string,
  sheetNames: string[] = ["Sheet1"],
  parentFolderId?: string
): Promise<SpreadsheetInfo> {
  const res = await sheets().spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: sheetNames.map((name) => ({
        properties: { title: name },
      })),
    },
  });

  const spreadsheetId = res.data.spreadsheetId!;

  // Move to folder if specified
  if (parentFolderId) {
    const file = await drive().files.get({ fileId: spreadsheetId, fields: "parents" });
    await drive().files.update({
      fileId: spreadsheetId,
      addParents: parentFolderId,
      removeParents: (file.data.parents || []).join(","),
    });
  }

  return {
    id: spreadsheetId,
    title: res.data.properties?.title || title,
    url: res.data.spreadsheetUrl || "",
    sheetNames: (res.data.sheets || []).map((s) => s.properties?.title || ""),
  };
}

export async function readRange(
  spreadsheetId: string,
  range: string
): Promise<string[][]> {
  const res = await sheets().spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return (res.data.values || []) as string[][];
}

export async function writeRange(
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<{ updatedCells: number }> {
  const res = await sheets().spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
  return { updatedCells: res.data.updatedCells || 0 };
}

export async function appendRows(
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<{ updatedRows: number }> {
  const res = await sheets().spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
  return { updatedRows: res.data.updates?.updatedRows || 0 };
}

export async function getSpreadsheetInfo(
  spreadsheetId: string
): Promise<SpreadsheetInfo> {
  const res = await sheets().spreadsheets.get({
    spreadsheetId,
    fields: "spreadsheetId,properties.title,spreadsheetUrl,sheets.properties.title",
  });
  return {
    id: res.data.spreadsheetId!,
    title: res.data.properties?.title || "",
    url: res.data.spreadsheetUrl || "",
    sheetNames: (res.data.sheets || []).map((s) => s.properties?.title || ""),
  };
}

export async function clearRange(
  spreadsheetId: string,
  range: string
): Promise<void> {
  await sheets().spreadsheets.values.clear({
    spreadsheetId,
    range,
  });
}

export async function addSheet(
  spreadsheetId: string,
  title: string
): Promise<void> {
  await sheets().spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title } } }],
    },
  });
}
