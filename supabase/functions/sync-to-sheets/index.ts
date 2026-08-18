import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Google Sheets configuration
// Set these as edge function secrets:
//   GOOGLE_SHEETS_SPREADSHEET_ID
//   GOOGLE_SHEETS_API_KEY  (a Google API key with Sheets API enabled)
//   GOOGLE_SHEETS_AMBITUS_SHEET_NAME  (default: "Ambitus Students")
//   GOOGLE_SHEETS_NON_AMBITUS_SHEET_NAME  (default: "Non-Ambitus Students")
const SPREADSHEET_ID = Deno.env.get("GOOGLE_SHEETS_SPREADSHEET_ID") ?? "";
const SHEETS_API_KEY = Deno.env.get("GOOGLE_SHEETS_API_KEY") ?? "";
const AMBITUS_SHEET = Deno.env.get("GOOGLE_SHEETS_AMBITUS_SHEET_NAME") ?? "Ambitus Students";
const NON_AMBITUS_SHEET = Deno.env.get("GOOGLE_SHEETS_NON_AMBITUS_SHEET_NAME") ?? "Non-Ambitus Students";

interface DelegateRow {
  id: string;
  name: string;
  email: string;
  school: string;
  phone: string;
  experience: string | null;
  is_ambitus_student: boolean;
  preference_1_committee: string;
  preference_1_country: string;
  preference_2_committee: string;
  preference_2_country: string;
  preference_3_committee: string;
  preference_3_country: string;
  payment_proof_url: string | null;
  payment_status: string;
  registration_status: string;
  created_at: string;
}

function delegateToRow(d: DelegateRow): string[] {
  return [
    d.name,
    d.email,
    d.school,
    d.phone,
    d.experience ?? "",
    d.preference_1_committee,
    d.preference_1_country,
    d.preference_2_committee,
    d.preference_2_country,
    d.preference_3_committee,
    d.preference_3_country,
    d.payment_proof_url ?? "",
    d.payment_status,
    d.registration_status,
    new Date(d.created_at).toISOString(),
  ];
}

const HEADER_ROW: string[] = [
  "Name",
  "Email",
  "School",
  "Phone",
  "Experience",
  "Pref 1 Committee",
  "Pref 1 Country/Personality",
  "Pref 2 Committee",
  "Pref 2 Country/Personality",
  "Pref 3 Committee",
  "Pref 3 Country/Personality",
  "Payment Proof URL",
  "Payment Status",
  "Registration Status",
  "Created At",
];

async function ensureSheetExists(spreadsheetId: string, sheetName: string, apiKey: string): Promise<void> {
  // Check if the sheet exists by fetching its metadata
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title&key=${apiKey}`;
  const metaRes = await fetch(metaUrl);
  if (!metaRes.ok) {
    const txt = await metaRes.text();
    throw new Error(`Failed to fetch spreadsheet metadata: ${metaRes.status} ${txt}`);
  }
  const meta = await metaRes.json();
  const existingSheets: string[] = (meta.sheets ?? []).map((s: any) => s.properties?.title);
  if (!existingSheets.includes(sheetName)) {
    // Create the sheet via batchUpdate
    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate?key=${apiKey}`;
    const batchRes = await fetch(batchUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: { title: sheetName },
            },
          },
        ],
      }),
    });
    if (!batchRes.ok) {
      const txt = await batchRes.text();
      throw new Error(`Failed to create sheet "${sheetName}": ${batchRes.status} ${txt}`);
    }
  }
}

async function ensureHeaderRow(spreadsheetId: string, sheetName: string, apiKey: string): Promise<void> {
  // Read row 1
  const range = encodeURIComponent(`${sheetName}!A1:O1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return; // sheet might be empty or inaccessible; skip
  const data = await res.json();
  const values: string[][] = data.values ?? [];
  if (values.length === 0 || JSON.stringify(values[0]) !== JSON.stringify(HEADER_ROW)) {
    // Write header row
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW&key=${apiKey}`;
    await fetch(updateUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: [HEADER_ROW] }),
    });
  }
}

async function appendDelegateToSheet(
  spreadsheetId: string,
  sheetName: string,
  row: string[],
  apiKey: string
): Promise<void> {
  const range = encodeURIComponent(`${sheetName}!A:O`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values: [row] }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to append to sheet "${sheetName}": ${res.status} ${txt}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const delegateId: string | undefined = body.delegateId;

    if (!delegateId) {
      return new Response(
        JSON.stringify({ error: "delegateId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SPREADSHEET_ID || !SHEETS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Google Sheets not configured. Set GOOGLE_SHEETS_SPREADSHEET_ID and GOOGLE_SHEETS_API_KEY as edge function secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the delegate
    const { data: delegate, error } = await supabase
      .from("delegates")
      .select("*")
      .eq("id", delegateId)
      .maybeSingle();

    if (error || !delegate) {
      return new Response(
        JSON.stringify({ error: "Delegate not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const row = delegateToRow(delegate as DelegateRow);
    const sheetName = delegate.is_ambitus_student ? AMBITUS_SHEET : NON_AMBITUS_SHEET;

    // Ensure sheet exists and has header
    await ensureSheetExists(SPREADSHEET_ID, sheetName, SHEETS_API_KEY);
    await ensureHeaderRow(SPREADSHEET_ID, sheetName, SHEETS_API_KEY);

    // Append the delegate row
    await appendDelegateToSheet(SPREADSHEET_ID, sheetName, row, SHEETS_API_KEY);

    return new Response(
      JSON.stringify({ success: true, sheet: sheetName }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
