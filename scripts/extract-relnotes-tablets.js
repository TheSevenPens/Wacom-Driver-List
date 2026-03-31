/**
 * Scans release notes HTML files from the driver archive and extracts
 * compatible tablet model numbers for each driver version + OS.
 *
 * Usage: node scripts/extract-relnotes-tablets.js
 *
 * Reads ARCHIVE_ROOT from .env to find the archive folder.
 * Outputs to src/lib/data/relnotes-tablets.json
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Read archive root from .env
const envPath = join(root, '.env');
if (!existsSync(envPath)) {
  console.error('.env file not found. Set ARCHIVE_ROOT in .env');
  process.exit(1);
}
let archiveRoot = '';
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  if (line.startsWith('ARCHIVE_ROOT=')) {
    archiveRoot = line.slice('ARCHIVE_ROOT='.length).trim();
    break;
  }
}
if (!archiveRoot) {
  console.error('ARCHIVE_ROOT not found in .env');
  process.exit(1);
}

const outPath = join(root, 'src', 'lib', 'data', 'relnotes-tablets.json');

/**
 * Extract text content between the first occurrence of an open and close tag.
 * Returns the inner text with all HTML tags stripped.
 */
function stripTags(html) {
  let result = '';
  let inTag = false;
  for (let i = 0; i < html.length; i++) {
    if (html[i] === '<') {
      inTag = true;
    } else if (html[i] === '>') {
      inTag = false;
    } else if (!inTag) {
      result += html[i];
    }
  }
  return result.trim();
}

/**
 * Find the product-list section and extract model numbers from table rows.
 */
function extractModels(html) {
  // Find the product-list div
  const marker = 'id="product-list"';
  const startIdx = html.indexOf(marker);
  if (startIdx === -1) return [];

  // Find the closing </div> for product-list (or </table> as boundary)
  const tableEnd = html.indexOf('</table>', startIdx);
  if (tableEnd === -1) return [];

  const section = html.slice(startIdx, tableEnd);

  // Extract each <tr>...</tr>
  const models = [];
  let searchFrom = 0;
  while (true) {
    const trStart = section.indexOf('<tr', searchFrom);
    if (trStart === -1) break;

    const trEnd = section.indexOf('</tr>', trStart);
    if (trEnd === -1) break;

    const row = section.slice(trStart, trEnd);
    searchFrom = trEnd + 5;

    // Skip header rows
    if (row.indexOf('tableheader') !== -1) continue;

    // Find the second <td> which contains model numbers
    let tdCount = 0;
    let tdSearchFrom = 0;
    let modelText = '';
    while (true) {
      const tdStart = row.indexOf('<td', tdSearchFrom);
      if (tdStart === -1) break;

      const tdContentStart = row.indexOf('>', tdStart) + 1;
      const tdEnd = row.indexOf('</td>', tdContentStart);
      if (tdEnd === -1) break;

      tdCount++;
      if (tdCount === 2) {
        modelText = stripTags(row.slice(tdContentStart, tdEnd));
        break;
      }
      tdSearchFrom = tdEnd + 5;
    }

    if (!modelText) continue;

    // Parse model numbers from text like "DTH-1320, 1620, DTK-2420, DTH-2420, 3220"
    // or "CTL and CTH-490, 690" or just "DTU-1031X"
    const rawModels = parseModelString(modelText);
    for (const m of rawModels) {
      const normalized = normalizeModel(m);
      if (normalized && !models.includes(normalized)) {
        models.push(normalized);
      }
    }
  }

  return models.sort();
}

/**
 * Parse a model string like "DTH-1320, 1620, DTK-2420" into individual model numbers.
 * Handles patterns like:
 *   "DTH-1320, 1620"              -> ["DTH-1320", "DTH-1620"]
 *   "CTL and CTH-490, 690"        -> ["CTL-490", "CTL-690", "CTH-490", "CTH-690"]
 *   "DTU-1031X"                   -> ["DTU-1031X"]
 *   "PTH-660, 860"                -> ["PTH-660", "PTH-860"]
 *   "DTK-1300/DTH-1300"           -> ["DTK-1300", "DTH-1300"]
 *   "CTL-480, 690/CTH-480, 690"   -> ["CTL-480", "CTL-690", "CTH-480", "CTH-690"]
 */
function parseModelString(text) {
  text = text.replace(/\s+/g, ' ').trim();
  if (!text) return [];

  const results = [];

  // First split on "/" to handle "DTK-1300/DTH-1300" and "CTL-480, 690/CTH-480, 690"
  const slashParts = text.split('/');

  for (const slashPart of slashParts) {
    // Then split on " and " to handle "CTL and CTH-490, 690"
    const andParts = slashPart.split(' and ');

    // Collect prefixes from all "and" parts, then apply suffixes from the last part
    const prefixes = [];
    let lastPart = '';

    for (const part of andParts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Check if this is just a bare prefix (all letters, no dash, no digits)
      if (isAllLetters(trimmed)) {
        prefixes.push(trimmed);
      } else {
        prefixes.push(null); // marker: this part has its own suffixes
        lastPart = trimmed;
        parseWithPrefix(trimmed, null, results);
      }
    }

    // For bare prefixes (from "and" splits), apply same suffixes as the last part
    if (lastPart) {
      // Extract suffixes from lastPart
      const suffixes = extractSuffixes(lastPart);
      for (const prefix of prefixes) {
        if (prefix !== null && suffixes.length > 0) {
          for (const suffix of suffixes) {
            results.push(prefix + '-' + suffix);
          }
        }
      }
    }
  }

  return results;
}

/**
 * Parse a segment like "DTH-1320, 1620, W1320" and add results.
 */
function parseWithPrefix(text, inheritedPrefix, results) {
  const segments = text.split(',').map(s => s.trim()).filter(Boolean);
  let currentPrefix = inheritedPrefix || '';

  for (const seg of segments) {
    const parts = seg.split(/\s+/);
    for (const part of parts) {
      if (!part) continue;

      const dashIdx = part.indexOf('-');
      if (dashIdx !== -1) {
        const beforeDash = part.slice(0, dashIdx);
        if (isAllLetters(beforeDash)) {
          currentPrefix = beforeDash;
          const suffix = part.slice(dashIdx + 1);
          if (suffix) results.push(currentPrefix + '-' + suffix);
        } else {
          results.push(part);
        }
      } else if (currentPrefix && hasDigit(part)) {
        results.push(currentPrefix + '-' + part);
      } else if (hasDigit(part)) {
        // Standalone model with no prefix context (e.g. "CTC4110WL")
        results.push(part);
      }
      // Skip bare letters with no digits (noise)
    }
  }
}

/**
 * Extract numeric suffixes from a prefix-bearing string like "CTH-490, 690"
 * Returns ["490", "690"]
 */
function extractSuffixes(text) {
  const suffixes = [];
  const segments = text.split(',').map(s => s.trim()).filter(Boolean);
  for (const seg of segments) {
    const parts = seg.split(/\s+/);
    for (const part of parts) {
      const dashIdx = part.indexOf('-');
      if (dashIdx !== -1) {
        const suffix = part.slice(dashIdx + 1);
        if (suffix && hasDigit(suffix)) suffixes.push(suffix);
      } else if (hasDigit(part)) {
        suffixes.push(part);
      }
    }
  }
  return suffixes;
}

/**
 * Normalize model number by removing dashes.
 * e.g. "DTH-1320" -> "DTH1320", "DTC-121W5Z" -> "DTC121W5Z"
 */
function normalizeModel(model) {
  if (!model) return model;
  return model.split('-').join('');
}

function hasDigit(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 48 && c <= 57) return true;
  }
  return false;
}

function isAllLetters(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (!((c >= 65 && c <= 90) || (c >= 97 && c <= 122))) return false;
  }
  return true;
}

// Main
const folders = readdirSync(archiveRoot);
const results = [];
let htmlCount = 0;

for (const folder of folders) {
  const folderPath = join(archiveRoot, folder);

  // Parse version and OS from folder name like "6.4.9-2_WINDOWS"
  const underscoreIdx = folder.lastIndexOf('_');
  if (underscoreIdx === -1) continue;

  const version = folder.slice(0, underscoreIdx);
  const os = folder.slice(underscoreIdx + 1);

  // Find HTML files in this folder
  let files;
  try {
    files = readdirSync(folderPath);
  } catch {
    continue;
  }

  const htmlFiles = files.filter(f => f.endsWith('.html'));
  if (htmlFiles.length === 0) continue;

  // Read the first HTML file
  const htmlPath = join(folderPath, htmlFiles[0]);
  let html;
  try {
    html = readFileSync(htmlPath, 'utf8');
  } catch {
    continue;
  }

  htmlCount++;
  const models = extractModels(html);

  if (models.length > 0) {
    results.push({
      version,
      os,
      models,
    });
  }
}

results.sort((a, b) => {
  const cmp = a.version.localeCompare(b.version, undefined, { numeric: true });
  if (cmp !== 0) return cmp;
  return a.os.localeCompare(b.os);
});

writeFileSync(outPath, JSON.stringify(results, null, 2) + '\n');
console.log(`Scanned ${htmlCount} release notes HTML files`);
console.log(`Found tablet compatibility for ${results.length} driver versions`);
console.log(`Wrote to ${outPath}`);
