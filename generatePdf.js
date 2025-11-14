// generatePdf.js
// 1. Read restaurants-google.csv
// 2. For each restaurant, fetch metadata (image, description) from the link
// 3. Render report.html with Handlebars, passing restaurants with metadata
// 4. Output HTML (PDF generation can be added if needed)

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { parse } = require("csv-parse/sync");
const fetch = require("node-fetch");
const Handlebars = require("handlebars");
const metascraper = require("metascraper")([
  require("metascraper-image")(),
  require("metascraper-description")(),
]);

const CURRENT_LETTER = "E";
const csvPath = path.join(__dirname, "serapi-a.csv");
const htmlTemplatePath = path.join(__dirname, "report.html");

async function getMetadata(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const metadata = await metascraper({ html, url });
    return {
      image: metadata.image || "",
      description: metadata.description || "",
    };
  } catch (e) {
    return { image: "", description: "" };
  }
}

async function main() {
  // Read CSV
  const csvContent = fs.readFileSync(csvPath, "utf8");
  const records = parse(csvContent, {
    columns: true,
    delimiter: ";",
    skip_empty_lines: true,
    quote: "\0", // Disable quote parsing
  });

  // Filter by letter 'A' (ignoring 'Restaurante ' prefix)
  const filtered = records.filter((row) => {
    let name = row.title.trim();
    if (name.toLowerCase().startsWith("pizzaria do ")) {
      name = name.slice("pizzaria do ".length).trim();
    }
    if (name.toLowerCase().startsWith("pizzaria da ")) {
      name = name.slice("pizzaria da ".length).trim();
    }
    if (name.toLowerCase().startsWith("pizzaria ")) {
      name = name.slice("pizzaria ".length).trim();
    }
    if (name.toLowerCase().startsWith("restaurante do ")) {
      name = name.slice("restaurante do ".length).trim();
    }
    if (name.toLowerCase().startsWith("restaurante da ")) {
      name = name.slice("restaurante da ".length).trim();
    }
    if (name.toLowerCase().startsWith("restaurante ")) {
      name = name.slice("restaurante ".length).trim();
    }
    if (name.toLowerCase().startsWith("bar do")) {
      name = name.slice("bar do".length).trim();
    }
    if (name.toLowerCase().startsWith("bar da")) {
      name = name.slice("bar da".length).trim();
    }
    if (name.toLowerCase().startsWith("bar ")) {
      name = name.slice("bar ".length).trim();
    }
    if (name.toLowerCase().startsWith("café do")) {
      name = name.slice("café do".length).trim();
    }
    if (name.toLowerCase().startsWith("café da")) {
      name = name.slice("café da".length).trim();
    }
    if (name.toLowerCase().startsWith("café com")) {
      name = name.slice("café com".length).trim();
    }
    if (name.toLowerCase().startsWith("café ")) {
      name = name.slice("café ".length).trim();
    }
    if (name.toLowerCase().startsWith("cafe do")) {
      name = name.slice("cafe do".length).trim();
    }
    if (name.toLowerCase().startsWith("cafe da")) {
      name = name.slice("cafe da".length).trim();
    }
    if (name.toLowerCase().startsWith("cafe com")) {
      name = name.slice("cafe com".length).trim();
    }
    if (name.toLowerCase().startsWith("cafe ")) {
      name = name.slice("cafe ".length).trim();
    }
    if (name.toLowerCase().startsWith("cafeteria do")) {
      name = name.slice("cafeteria do".length).trim();
    }
    if (name.toLowerCase().startsWith("cafeteria da")) {
      name = name.slice("cafeteria da".length).trim();
    }
    if (name.toLowerCase().startsWith("cafeteria com")) {
      name = name.slice("cafeteria com".length).trim();
    }
    if (name.toLowerCase().startsWith("cafeteria ")) {
      name = name.slice("cafeteria ".length).trim();
    }
    return name[0]?.toUpperCase() === CURRENT_LETTER;
  });

  // Filter unique names (case-insensitive, ignoring 'Restaurante ' prefix)
  const seen = new Set();
  const unique = filtered.filter((row) => {
    let name = row.title.trim();
    if (name.toLowerCase().startsWith("restaurante ")) {
      name = name.slice("restaurante ".length).trim();
    }
    const key = name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Fetch metadata for each unique restaurant
  const restaurants = [];
  for (const row of unique) {
    const name = row.title;
    const link =
      "https://www.google.com/maps/place/?q=place_id:" + row.place_id;
    const meta = await getMetadata(link);
    const rating = row.rating;
    const reviews = row.reviews;
    const address = row.address;
    const hours = row.openning_hours ? JSON.parse(row.openning_hours) : null;
    const website = row.website;
    console.log(`Fetched metadata for ${name} (${link})`);
    restaurants.push({
      name,
      link,
      rating,
      reviews,
      address,
      hours,
      website,
      ...meta,
    });
  }

  // Sort restaurants alphabetically by name (ignoring case)
  restaurants.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  // Read and compile Handlebars template
  const templateContent = fs.readFileSync(htmlTemplatePath, "utf8");
  const template = Handlebars.compile(templateContent);

  // Render HTML with letter 'A'
  const html = template({ letter: CURRENT_LETTER, restaurants });
  fs.writeFileSync(`report-generated-${CURRENT_LETTER}.html`, html);
  console.log(`Generated report-generated-${CURRENT_LETTER}.html`);
}

main();
