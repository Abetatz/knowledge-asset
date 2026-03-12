import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { query } from "../db/connection.js";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URL = process.env.GOOGLE_REDIRECT_URL || "http://localhost:5000/api/google/callback";

export function getOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
}

export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  const scopes = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.appdata",
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });

  return authUrl;
}

export async function handleAuthCallback(code: string, userId: number): Promise<void> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("Failed to get access token");
  }

  // Store tokens in database
  await query(
    `INSERT INTO google_drive_tokens (user_id, access_token, refresh_token, expiry_date)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE SET
       access_token = $2,
       refresh_token = $3,
       expiry_date = $4,
       updated_at = CURRENT_TIMESTAMP;`,
    [
      userId,
      tokens.access_token,
      tokens.refresh_token || null,
      tokens.expiry_date || null,
    ]
  );
}

export async function getOAuth2ClientForUser(userId: number): Promise<OAuth2Client | null> {
  const result = await query(
    "SELECT access_token, refresh_token, expiry_date FROM google_drive_tokens WHERE user_id = $1;",
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const { access_token, refresh_token, expiry_date } = result.rows[0];
  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    access_token,
    refresh_token,
    expiry_date,
  });

  return oauth2Client;
}

export async function backupToDrive(userId: number, data: any): Promise<void> {
  const oauth2Client = await getOAuth2ClientForUser(userId);
  if (!oauth2Client) {
    throw new Error("Google Drive not connected");
  }

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  // Create or update backup file
  const fileName = `knowledge-asset-backup-${new Date().toISOString().split("T")[0]}.json`;
  const fileContent = JSON.stringify(data, null, 2);

  // Search for existing file
  const searchResult = await drive.files.list({
    q: `name='${fileName}' and trashed=false`,
    spaces: "drive",
    fields: "files(id)",
  });

  const existingFile = searchResult.data.files?.[0];

  if (existingFile && existingFile.id) {
    // Update existing file
    await drive.files.update({
      fileId: existingFile.id as string,
      media: {
        mimeType: "application/json",
        body: fileContent,
      },
    } as any);
  } else {
    // Create new file
    await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: "application/json",
      },
      media: {
        mimeType: "application/json",
        body: fileContent,
      },
    } as any);
  }
}

export async function exportToCSV(entries: any[]): Promise<string> {
  const headers = [
    "ID",
    "Title",
    "Phenomenon",
    "Background",
    "Judgment",
    "Judgment Reason",
    "Alternative Options",
    "Future Verification",
    "Additional 1",
    "Additional 2",
    "Additional 3",
    "Additional 4",
    "Tags",
    "Created At",
    "Updated At",
  ];

  const rows = entries.map((entry) => [
    entry.id,
    `"${entry.title.replace(/"/g, '""')}"`,
    `"${entry.phenomenon.replace(/"/g, '""')}"`,
    `"${entry.background.replace(/"/g, '""')}"`,
    `"${entry.judgment.replace(/"/g, '""')}"`,
    `"${entry.judgment_reason.replace(/"/g, '""')}"`,
    `"${entry.alternative_options.replace(/"/g, '""')}"`,
    `"${entry.future_verification.replace(/"/g, '""')}"`,
    `"${(entry.additional_1 || "").replace(/"/g, '""')}"`,
    `"${(entry.additional_2 || "").replace(/"/g, '""')}"`,
    `"${(entry.additional_3 || "").replace(/"/g, '""')}"`,
    `"${(entry.additional_4 || "").replace(/"/g, '""')}"`,
    `"${entry.tags?.map((t: any) => t.name).join(", ") || ""}"`,
    entry.created_at,
    entry.updated_at,
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
