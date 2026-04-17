import { supabase } from "./supabase";

export const getDetectionsFromSupabase = async () => {
  // Try full query with note/status (requires schema.sql to have been run)
  const { data, error } = await supabase
    .from("espData")
    .select("anchor_id, ssid, rssi, block_number, mac, note, status")
    .limit(50);

  if (error) {
    // Columns don't exist yet — fall back to base columns
    const { data: fallback, error: fallbackErr } = await supabase
      .from("espData")
      .select("anchor_id, ssid, rssi, block_number, mac")
      .limit(50);

    if (fallbackErr) {
      console.error("Supabase fetch error:", fallbackErr.message);
      return [];
    }

    return (fallback || []).map((row) => ({
      mac: row.mac,
      anchor: row.anchor_id,
      ssid: row.ssid,
      rssi: row.rssi,
      block: row.block_number,
      note: null,
      status: "active",
    }));
  }

  return data.map((row) => ({
    mac: row.mac,
    anchor: row.anchor_id,
    ssid: row.ssid,
    rssi: row.rssi,
    block: row.block_number,
    note: row.note || null,
    status: row.status || "active",
  }));
};
