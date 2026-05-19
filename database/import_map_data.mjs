#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GROUP = argValue("--group") ?? "major";
const DATABASE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(DATABASE_DIR, "map-previews", `${GROUP}.preview.json`);
const LEGACY_MAJOR_DATA_FILE = path.resolve(DATABASE_DIR, "major_university_map_data.preview.json");
const REQUIRED_CATEGORIES = new Set(["cafe", "food", "dormitory", "market", "transport", "library"]);

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const data = JSON.parse(await readPreviewFile());

async function readPreviewFile() {
  try {
    return await readFile(DATA_FILE, "utf8");
  } catch (error) {
    if (GROUP === "major") {
      return readFile(LEGACY_MAJOR_DATA_FILE, "utf8");
    }
    throw error;
  }
}
if (!Array.isArray(data) || data.length === 0) {
  throw new Error(`No map data found in ${DATA_FILE}`);
}

for (const university of data) {
  if (!university.id || !university.universityName || !Number.isFinite(university.lat) || !Number.isFinite(university.lng)) {
    throw new Error(`Invalid university record: ${JSON.stringify(university)}`);
  }
  if (!Array.isArray(university.places)) {
    throw new Error(`Invalid nearby places for ${university.universityName}`);
  }
  for (const place of university.places) {
    if (!place.name || !REQUIRED_CATEGORIES.has(place.category) || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) {
      throw new Error(`Invalid nearby place for ${university.universityName}: ${JSON.stringify(place)}`);
    }
  }
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function uniquePlaces(university) {
  const byExternalId = new Map();
  for (const [index, place] of university.places.entries()) {
    const externalId = place.externalId ?? `${GROUP}-pilot/${university.id}/${place.category}/${index + 1}`;
    if (!byExternalId.has(externalId)) {
      byExternalId.set(externalId, { ...place, externalId });
    }
  }
  return [...byExternalId.values()];
}

const ids = data.map((u) => u.id).join(", ");
const lines = [
  "BEGIN;",
  `DELETE FROM nearby_places WHERE university_id IN (${ids});`,
];

for (const university of data) {
  lines.push(
    `INSERT INTO university_locations (university_id, latitude, longitude, source, source_date, confidence, updated_at) VALUES (` +
      `${university.id}, ${university.lat}, ${university.lng}, ${sql(university.source)}, ${sql(university.sourceDate)}, ${sql(university.confidence ?? "PILOT")}, NOW()) ` +
      `ON CONFLICT (university_id) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, ` +
      `source = EXCLUDED.source, source_date = EXCLUDED.source_date, confidence = EXCLUDED.confidence, updated_at = NOW();`
  );

  uniquePlaces(university).forEach((place) => {
    lines.push(
      `INSERT INTO nearby_places (university_id, name, category, subtype, latitude, longitude, distance_meters, source, source_date, external_id) VALUES (` +
        `${university.id}, ${sql(place.name)}, ${sql(place.category)}, ${sql(place.subtype)}, ${place.lat}, ${place.lng}, ${Math.round(place.distanceMeters)}, ` +
        `${sql(university.source)}, ${sql(university.sourceDate)}, ${sql(place.externalId)});`
    );
  });
}

lines.push(
  "COMMIT;",
  "SELECT COUNT(*) AS university_location_count FROM university_locations WHERE university_id IN (" + ids + ");",
  "SELECT university_id, COUNT(*) AS nearby_place_count FROM nearby_places WHERE university_id IN (" + ids + ") GROUP BY university_id ORDER BY university_id;"
);

const result = spawnSync(
  "docker",
  ["compose", "exec", "-T", "postgres", "psql", "-q", "-U", "postgres", "-d", "universiteatlasi", "-v", "ON_ERROR_STOP=1"],
  { input: lines.join("\n"), cwd: path.resolve(DATABASE_DIR, ".."), encoding: "utf8", maxBuffer: 1024 * 1024 * 10 }
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);
