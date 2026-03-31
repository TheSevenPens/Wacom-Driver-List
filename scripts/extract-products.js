/**
 * Extracts product data from Wacom's update.xml into wacom-products.json.
 *
 * Usage: node scripts/extract-products.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const xmlPath = join(root, 'data', 'wacom-update.xml');
const outPath = join(root, 'src', 'lib', 'data', 'wacom-products.json');

const xml = readFileSync(xmlPath, 'utf8');

function parseProducts(section) {
  const products = [];
  const productRegex = /<ArrayElement type="map">([\s\S]*?)<\/ArrayElement>/g;
  let m;
  while ((m = productRegex.exec(section)) !== null) {
    const block = m[1];
    const get = (tag) => {
      const r = new RegExp('<' + tag + ' type="(?:string|integer|bool)">(.*?)</' + tag + '>');
      const found = r.exec(block);
      return found ? found[1] : null;
    };
    const name = get('name');
    if (!name) continue;
    products.push({
      name,
      sensorid: get('sensorid'),
      model: get('model'),
      drivermin: get('drivermin'),
      drivermax: get('drivermax'),
    });
  }
  return products;
}

function getProductsSection(platformXml) {
  const m = platformXml.match(/<products type="array">([\s\S]*)<\/products>/);
  return m ? m[1] : '';
}

const winMatch = xml.match(/<win type="map">([\s\S]*?)<\/win>/);
const macMatch = xml.match(/<mac type="map">([\s\S]*?)<\/mac>/);

const winProducts = winMatch ? parseProducts(getProductsSection(winMatch[1])) : [];
const macProducts = macMatch ? parseProducts(getProductsSection(macMatch[1])) : [];

// Merge by name, deduplicate platforms
const merged = new Map();
for (const p of winProducts) {
  merged.set(p.name, { ...p, platforms: ['Windows'] });
}
for (const p of macProducts) {
  if (merged.has(p.name)) {
    const existing = merged.get(p.name);
    if (!existing.platforms.includes('MacOS')) {
      existing.platforms.push('MacOS');
    }
    if (!existing.model && p.model) existing.model = p.model;
  } else {
    merged.set(p.name, { ...p, platforms: ['MacOS'] });
  }
}

// Fix known incorrect model numbers from the XML
const modelFixes = {
  'CTC6110BT': 'CTC6110WL',
  'CTC4110BT': 'CTC4110WL',
};

function fixModel(model) {
  if (model && model in modelFixes) return modelFixes[model];
  return model;
}

// Models that don't correspond to real tablets — remove these rows
const removeModels = ['PT470BT', 'PTK870K022D', 'PTK870BT', 'PTK670BT'];

// Normalize names: remove dashes from model-number prefixes
const modelPrefixes = ['DTH-', 'DTK-', 'DTU-'];

function normalizeName(name) {
  for (const prefix of modelPrefixes) {
    if (name.startsWith(prefix)) {
      name = prefix.slice(0, 3) + name.slice(prefix.length);
    }
  }
  return name;
}

// Check if a name looks like a model number (starts with a known prefix without dash)
const modelStarts = ['DTH', 'DTK', 'DTU', 'DTC'];

function looksLikeModelNumber(name) {
  for (const prefix of modelStarts) {
    if (name.startsWith(prefix)) return true;
  }
  return false;
}

const result = [...merged.values()]
.filter(p => !removeModels.includes(p.model))
.map(p => {
  p.name = normalizeName(p.name);

  p.model = fixModel(p.model);

  // If model is missing and the name looks like a model number, use it
  if (!p.model && looksLikeModelNumber(p.name)) {
    p.model = p.name;
  }

  return p;
}).sort((a, b) => a.name.localeCompare(b.name));

writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');
console.log(`Wrote ${result.length} products to ${outPath}`);
