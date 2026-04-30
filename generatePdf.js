// generatePdf.js
// 1. Read restaurants-google.csv
// 2. For each restaurant, fetch metadata (image, description) from the link
// 3. Render report.html with Handlebars, passing restaurants with metadata
// 4. Output HTML (PDF generation can be added if needed)
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const fetch = require("node-fetch");
const Handlebars = require("handlebars");
const metascraper = require("metascraper")([
  require("metascraper-image")(),
  require("metascraper-description")(),
]);

const CURRENT_LETTER = process.env.CURRENT_LETTER.toUpperCase();
const csvPath = path.join(
  __dirname,
  `letters/${CURRENT_LETTER.toLowerCase()}/joined.csv`,
);
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

    const forbiddenWords = [
      "pizzaria",
      "restaurante",
      "bar",
      "café",
      "cafe",
      "cafeteria",
      "padaria",
      "panificadora",
      "pastelaria",
      "lanchonete",
      "churrascaria",
      "sorveteria",
      "doceria",
      "confeitaria",
      "hamburgueria",
      "sanduicheria",
    ];

    for (const word of forbiddenWords) {
      if (name.toLowerCase().startsWith(word + " do ")) {
        name = name.slice((word + " do ").length).trim();
      } else if (name.toLowerCase().startsWith(word + " da ")) {
        name = name.slice((word + " da ").length).trim();
      } else if (name.toLowerCase().startsWith(word + " com ")) {
        name = name.slice((word + " com ").length).trim();
      } else if (name.toLowerCase().startsWith(word + " ")) {
        name = name.slice((word + " ").length).trim();
      }
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
      "https://www.google.com/maps/search/?api=1&query=Google&query_place_id=" +
      row.place_id;
    const meta = await getMetadata(link);
    const rating = row.rating;
    const reviews = row.reviews;
    const address = row.address;
    let parsedHours = row.openning_hours ? JSON.parse(row.openning_hours) : null;
    let hours = null;

    if (parsedHours) {
      hours = {
        sunday: parsedHours['domingo'] || parsedHours.sunday || "Fechado",
        monday: parsedHours['segunda-feira'] || parsedHours.monday || "Fechado",
        tuesday: parsedHours['terça-feira'] || parsedHours.tuesday || "Fechado",
        wednesday: parsedHours['quarta-feira'] || parsedHours.wednesday || "Fechado",
        thursday: parsedHours['quinta-feira'] || parsedHours.thursday || "Fechado",
        friday: parsedHours['sexta-feira'] || parsedHours.friday || "Fechado",
        saturday: parsedHours['sábado'] || parsedHours.saturday || "Fechado",
      }
    }

    const website = row.website;
    const thumbnail = row.thumbnail;
    console.log(`Fetched metadata for ${name} (${link})`);
    restaurants.push({
      name,
      link,
      rating,
      reviews,
      address,
      hours,
      website,
      description: meta.description,
      image: thumbnail,
    });
  }

  // Sort restaurants alphabetically by name (ignoring case)
  restaurants.sort((a, b) => {
    const scoreA = a.rating * Math.log(1 + a.reviews);
    const scoreB = b.rating * Math.log(1 + b.reviews);
    if (scoreA === scoreB) {
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }
    return scoreB - scoreA; // Sort by score descending
  });

  // Read and compile Handlebars template
  const templateContent = fs.readFileSync(htmlTemplatePath, "utf8");
  const template = Handlebars.compile(templateContent);

  // Render HTML with letter 'A'
  const html = template({ letter: CURRENT_LETTER, restaurants });
  fs.writeFileSync(`report-generated-${CURRENT_LETTER}.html`, html);
  console.log(`Generated report-generated-${CURRENT_LETTER}.html`);
}

main();
