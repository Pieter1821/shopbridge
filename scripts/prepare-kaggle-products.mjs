import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2] || "c:/Users/Pieter/Downloads/styles.csv/styles.csv";
const outputPath = process.argv[3] || "c:/Users/Pieter/shopbridge/supabase/import/product_import_staging.csv";
const publicBaseUrl =
  process.argv[4] ||
  "https://vnsjgfqfspzgecbkujkt.supabase.co/storage/v1/object/public/product-images/images";
const limit = Number(process.argv[5] || 300);

function csvEscape(value) {
  const stringValue = value == null ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

const raw = fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "");
const lines = raw.split(/\r?\n/).filter(Boolean);
const headers = parseCsvLine(lines[0]);
const headerIndex = Object.fromEntries(headers.map((header, index) => [header, index]));

const desiredHeaders = [
  "source_id",
  "gender",
  "master_category",
  "sub_category",
  "article_type",
  "base_colour",
  "season",
  "year",
  "usage",
  "product_display_name",
  "image_url",
];

const allowedMasterCategories = new Set([
  "Apparel",
  "Accessories",
  "Footwear",
  "Personal Care",
  "Sporting Goods",
  "Free Items",
]);

const rows = [];
const seen = new Set();

for (const line of lines.slice(1)) {
  const cols = parseCsvLine(line);
  const sourceId = cols[headerIndex.id]?.trim();
  const masterCategory = cols[headerIndex.masterCategory]?.trim();
  const productDisplayName = cols[headerIndex.productDisplayName]?.trim();

  if (!sourceId || !productDisplayName || seen.has(sourceId)) {
    continue;
  }

  if (masterCategory && !allowedMasterCategories.has(masterCategory)) {
    continue;
  }

  seen.add(sourceId);

  rows.push([
    sourceId,
    cols[headerIndex.gender]?.trim() || "",
    masterCategory || "",
    cols[headerIndex.subCategory]?.trim() || "",
    cols[headerIndex.articleType]?.trim() || "",
    cols[headerIndex.baseColour]?.trim() || "",
    cols[headerIndex.season]?.trim() || "",
    cols[headerIndex.year]?.trim() || "",
    cols[headerIndex.usage]?.trim() || "",
    productDisplayName,
    `${publicBaseUrl}/${sourceId}.jpg`,
  ]);

  if (rows.length >= limit) {
    break;
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const output = [
  desiredHeaders.join(","),
  ...rows.map((row) => row.map(csvEscape).join(",")),
].join("\n");

fs.writeFileSync(outputPath, output, "utf8");

console.log(`Created ${rows.length} rows at: ${outputPath}`);
console.log(`Image base URL: ${publicBaseUrl}`);
console.log("Upload this CSV into public.product_import_staging");
