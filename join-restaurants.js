const fs = require("fs");
const path = require("path");

const csvFolder = path.join(__dirname, "letters/c");
const outputCsv = path.join(csvFolder, "joined.csv");

function getCsvFiles(folder) {
  return fs
    .readdirSync(folder)
    .filter((file) => file.endsWith(".csv"))
    .map((file) => path.join(folder, file));
}

function joinCsvFiles(files, outputFile) {
  let header = null;
  let rows = [];
  files.forEach((file, idx) => {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;
    if (idx === 0) {
      header = lines[0];
      rows = lines.slice(1);
    } else {
      rows = rows.concat(lines.slice(1));
    }
  });
  if (header) {
    fs.writeFileSync(outputFile, header + "\n" + rows.join("\n"));
    console.log(`Joined CSV written to ${outputFile}`);
  } else {
    console.log("No CSV files found or files are empty.");
  }
}

const csvFiles = getCsvFiles(csvFolder);
joinCsvFiles(csvFiles, outputCsv);
