import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import xlsx from "xlsx";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const XLSX_PATH =
  process.argv[2] || "uusmaa_objektid_2026-02-09_19_06.xlsx";

const DO_PURGE = process.argv.includes("--purge");

const toNum = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v)
    .replace(/\s/g, "")
    .replace("€", "")
    .replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const cleanStr = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s;
};

const makeAddress = (row) => {
  const street = cleanStr(row["Tänav"]);
  const houseNo = cleanStr(row["Maja nr"]);
  const aptNo = cleanStr(row["Korteri nr"]);
  let addr = [street, houseNo].filter(Boolean).join(" ");
  if (aptNo) addr += `-${aptNo}`;
  return addr || cleanStr(row["ID"]) || "Unknown address";
};

const makeTags = (row) => {
  const tags = new Set();

  const deal = cleanStr(row["Tehing"]);
  const type = cleanStr(row["Objekti liik"]);
  const detail = cleanStr(row["Objekti täpsustus"]);
  const district = cleanStr(row["Linnaosa"]);
  const heating = cleanStr(row["Küte"]);
  const condition = cleanStr(row["Seisukord"]);
  const parking = cleanStr(row["Parkimine"]);

  [deal, type, detail, district, heating, condition, parking]
    .filter(Boolean)
    .forEach((t) => tags.add(t.toLowerCase()));

  // Some helpful normalized tags
  const rooms = toNum(row["Tube"]);
  if (rooms) tags.add(`${rooms}-rooms`);

  return Array.from(tags).slice(0, 25); // keep reasonable
};

const makeDescription = (row) => {
  const parts = [];
  const extras = cleanStr(row["Lisad"]);
  const detail = cleanStr(row["Objekti täpsustus"]);
  const material = cleanStr(row["Ehitise materjal"]);
  const energy = cleanStr(row["Energiamärgis"]);

  if (detail) parts.push(detail);
  if (extras) parts.push(`Lisad: ${extras}`);
  if (material) parts.push(`Materjal: ${material}`);
  if (energy) parts.push(`Energiamärgis: ${energy}`);

  return parts.join("\n");
};

const main = async () => {
  const abs = path.resolve(XLSX_PATH);
  if (!fs.existsSync(abs)) {
    console.error("XLSX file not found:", abs);
    process.exit(1);
  }

  const wb = xlsx.readFile(abs);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];

  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

  console.log("Rows:", rows.length);

  if (DO_PURGE) {
    console.log("Purging houses + matches…");

    // If you have house_photos, delete it first:
    // await supabase.from("house_photos").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    await supabase
      .from("house_matches")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("houses")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("Purge done.");
  }

  const mapped = rows.map((row) => {
    const external_id = cleanStr(row["ID"]);
    const deal_type = cleanStr(row["Tehing"]);
    const object_type = cleanStr(row["Objekti liik"]);
    const city =
      cleanStr(row["Linn"]) ||
      cleanStr(row["Vald"]) ||
      cleanStr(row["Maakond"]);
    const address = makeAddress(row);

    const price = toNum(row["Tehingu hind"]);
    const rooms = toNum(row["Tube"]);
    const area_m2 = toNum(row["Üldpind (m2)"]);

    const tags = makeTags(row);
    const description = makeDescription(row);

    return {
      external_id,
      deal_type,
      object_type,
      address,
      city,
      price,
      rooms,
      tags,
      description,
      area_m2,
      raw_data: row, // store EVERYTHING
    };
  });

  // Insert in chunks
  const chunkSize = 100;
  for (let i = 0; i < mapped.length; i += chunkSize) {
    const chunk = mapped.slice(i, i + chunkSize);

    const { error } = await supabase.from("houses").insert(chunk);
    if (error) {
      console.error("Insert failed at chunk", i, error);
      process.exit(1);
    }
    console.log(
      `Inserted ${Math.min(i + chunkSize, mapped.length)} / ${mapped.length}`,
    );
  }

  console.log("✅ Import complete.");
};

main();

