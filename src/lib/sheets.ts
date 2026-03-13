import { google } from "googleapis";
import type { SheetRow } from "@/types";

function getAuth() {
  const credentials = {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
  };

  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SHEET_NAME = "NewsFlow Log";
const HEADERS = [
  "Date",
  "Title",
  "Source",
  "URL",
  "Keyword Tag",
  "Assigned To",
  "Status",
  "Platform",
  "Caption",
  "Posted By",
];

export async function ensureSheetHeaders() {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1:J1`,
    });

    if (!res.data.values || res.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [HEADERS] },
      });
    }
  } catch {
    // Sheet might not exist yet, create it
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: SHEET_NAME },
            },
          },
        ],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS] },
    });
  }
}

export async function appendSheetRow(row: SheetRow): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:J`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          row.date,
          row.title,
          row.source,
          row.url,
          row.keywordTag,
          row.assignedTo,
          row.status,
          row.platform,
          row.caption,
          row.postedBy,
        ],
      ],
    },
  });
}

export async function getRecentRows(limit = 50): Promise<SheetRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:J`,
    });

    if (!res.data.values) return [];

    return res.data.values
      .slice(-limit)
      .reverse()
      .map((row) => ({
        date: row[0] || "",
        title: row[1] || "",
        source: row[2] || "",
        url: row[3] || "",
        keywordTag: row[4] || "",
        assignedTo: row[5] || "",
        status: row[6] || "",
        platform: row[7] || "",
        caption: row[8] || "",
        postedBy: row[9] || "",
      }));
  } catch {
    return [];
  }
}
