#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DATABASE_DIR = path.dirname(fileURLToPath(import.meta.url));
const TARGET_DIR = path.resolve(DATABASE_DIR, "map-targets");
const OUTPUT_FILE = path.resolve(TARGET_DIR, "all.json");

const sql = `
SELECT COALESCE(json_agg(row_to_json(target) ORDER BY target."dbName"), '[]'::json)
FROM (
  SELECT
    id,
    ad AS "dbName",
    ad AS "campusName",
    BTRIM(sehir) AS "city",
    CONCAT(ad, ', ', COALESCE(NULLIF(BTRIM(sehir), ''), 'Turkiye'), ', Turkiye') AS "nominatimQuery",
    2500 AS "radiusMeters"
  FROM universitetler
  WHERE sehir IS NOT NULL
    AND BTRIM(sehir) <> ''
    AND UPPER(BTRIM(sehir)) NOT IN ('KIBRIS', 'BILINMIYOR', 'BİLİNMİYOR')
) target;
`;

const result = spawnSync(
  "docker",
  ["compose", "exec", "-T", "postgres", "psql", "-qAt", "-U", "postgres", "-d", "universiteatlasi", "-c", sql],
  { cwd: path.resolve(DATABASE_DIR, ".."), encoding: "utf8", maxBuffer: 1024 * 1024 * 20 }
);

if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);

const targets = JSON.parse(result.stdout.trim() || "[]");
await mkdir(TARGET_DIR, { recursive: true });
await writeFile(OUTPUT_FILE, `${JSON.stringify(targets, null, 2)}\n`, "utf8");

console.log(`Wrote ${targets.length} targets to ${OUTPUT_FILE}`);
console.log("Next: node database/preview_osm_nearby_places.mjs --group all --write");
console.log("After manual preview check: node database/import_map_data.mjs --group all");
