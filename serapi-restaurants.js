const fs = require("fs");
const fetch = require("node-fetch");

const CURRENT_LETTER = "e";

const LANCHONETE_OUTPUT_CSV = "serapi-lanchonete.csv";
const BAR_OUTPUT_CSV = "serapi-bar.csv";
const RESTAURANTE_OUTPUT_CSV = "serapi-restaurante.csv";
const CAFE_OUTPUT_CSV = "serapi-cafe.csv";
const PIZZARIA_OUTPUT_CSV = "serapi-pizzaria.csv";

const BASE_URL = "https://serpapi.com/search.json?engine=google_maps&q= ";
const END_URL = `*&ll=@-23.4900044,-47.4527187,13.51z&type=search&gl=br&hl=pt-br&lr=lang_pt&num=1000&api_key=${process.env.SERAPI_KEY}`;

const PLACES_TYPES = ["lanchonete", "bar", "restaurante", "cafe", "pizzaria"];

// CSV header (no quotes, ; separated)
const CSV_HEADER = [
  "title",
  "rating",
  "reviews",
  "address",
  "openning_hours",
  "website",
  "description",
  "place_id",
].join(";");

function escapeCsv(val) {
  if (val === undefined || val === null) return "";
  // Remove semicolons and newlines, do not add quotes
  return String(val)
    .replace(/[;\n\r]+/g, " ")
    .trim();
}

async function fetchAllResults(type) {
  let url = BASE_URL + type + " " + CURRENT_LETTER + "*" + END_URL;
  let allResults = [];
  let page = 1;
  while (url) {
    console.log(`Fetching page ${page}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const data = await res.json();
    if (Array.isArray(data.local_results)) {
      allResults = allResults.concat(data.local_results);
    }
    // Pagination
    url =
      data.serpapi_pagination && data.serpapi_pagination.next
        ? data.serpapi_pagination.next +
          "&api_key=d3429c2f9e8f1ac67aa514197b58df0cda55d35b956f0dcdc9900c4dd64ecc8a"
        : null;
    page++;
  }
  return allResults;
}

function toCsvRow(obj) {
  return [
    escapeCsv(obj.title),
    escapeCsv(obj.rating),
    escapeCsv(obj.reviews),
    escapeCsv(obj.address),
    escapeCsv(
      JSON.stringify(obj.operating_hours || obj.openning_hours || obj.hours)
    ),
    escapeCsv(obj.website),
    escapeCsv(obj.description),
    escapeCsv(obj.place_id),
  ].join(";");
}

async function main() {
  PLACES_TYPES.forEach(async (type) => {
    const results = await fetchAllResults(type);
    const lines = [CSV_HEADER];
    for (const r of results) {
      lines.push(toCsvRow(r));
    }
    fs.writeFileSync(
      `letters/${CURRENT_LETTER}/serapi-${type}.csv`,
      lines.join("\n"),
      "utf8"
    );
    console.log(`Wrote ${results.length} rows to serapi-${type}.csv`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
