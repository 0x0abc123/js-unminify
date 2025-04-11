const fs = require("fs");
const path = require("path");
const remapping = require("@ampproject/remapping");

const usageString = "Usage: node unminify.js <minified-file.js> <outputfolder>";

// Get source file from command-line arguments
const sourceFile = process.argv[2];
const outputDir = process.argv[3];

if (!sourceFile || !outputDir) {
  console.error(usageString);
  process.exit(1);
}

const mapFile = `${sourceFile}.map`;

// Check if files exist
if (!fs.existsSync(sourceFile) || !fs.existsSync(mapFile)) {
  console.error(`Files not found: ${sourceFile} and/or ${mapFile}`);
  process.exit(1);
}

// Read and parse the map file
const rawSourceMap = JSON.parse(fs.readFileSync(mapFile, "utf-8"));

// Apply remapping (not strictly needed here unless you're chaining maps)
const mergedMap = remapping(rawSourceMap, () => null);

// Ensure sourcesContent exists
if (!rawSourceMap.sourcesContent || rawSourceMap.sources.length !== rawSourceMap.sourcesContent.length) {
  console.error("Source map does not contain embedded sourcesContent. Cannot reconstruct source files.");
  process.exit(1);
}

// Create output directory
fs.mkdirSync(outputDir, { recursive: true });

// Reconstruct and write files
rawSourceMap.sources.forEach((source, index) => {
  const content = rawSourceMap.sourcesContent[index];
  if (content) {
    const fileName = source.replace(/^webpack:\/\/|^\.\//, "").replace(/\.\.\//g, "");
    const outputPath = path.join(outputDir, fileName);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content);
    console.log(`[+] Reconstructed: ${outputPath}`);
  } else {
    console.warn(`[!] No source content for: ${source}`);
  }
});
