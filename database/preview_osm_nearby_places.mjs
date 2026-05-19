#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE = "OpenStreetMap / Nominatim / Overpass";
const SOURCE_DATE = "2026-05-16";
const WRITE_FILE = process.argv.includes("--write");
const RETRY_EMPTY = process.argv.includes("--retry-empty");
const GROUP = argValue("--group") ?? "major";
const DATABASE_DIR = path.dirname(fileURLToPath(import.meta.url));
const TARGET_FILE = path.resolve(DATABASE_DIR, "map-targets", `${GROUP}.json`);
const OUTPUT_DIR = path.resolve(DATABASE_DIR, "map-previews");
const OUTPUT_FILE = path.resolve(OUTPUT_DIR, `${GROUP}.preview.json`);
const LEGACY_MAJOR_OUTPUT_FILE = path.resolve(DATABASE_DIR, "major_university_map_data.preview.json");
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];

const targets = JSON.parse(await readFile(TARGET_FILE, "utf8"));
const existingOutput = WRITE_FILE ? await readExistingOutput() : [];
const output = RETRY_EMPTY
  ? existingOutput.filter((item) => Array.isArray(item.places) && item.places.length > 0)
  : [...existingOutput];
const completedIds = new Set(output.map((item) => item.id));

const categoryConfig = {
  food: [
    ["amenity", "restaurant"],
    ["amenity", "fast_food"],
    ["amenity", "food_court"],
  ],
  cafe: [["amenity", "cafe"]],
  dormitory: [
    ["amenity", "dormitory"],
    ["building", "dormitory"],
  ],
  market: [
    ["shop", "supermarket"],
    ["shop", "convenience"],
  ],
  transport: [
    ["highway", "bus_stop"],
    ["public_transport", "platform"],
    ["railway", "station"],
    ["railway", "tram_stop"],
    ["railway", "subway_entrance"],
  ],
  library: [["amenity", "library"]],
};

const transportSubtypes = [
  { key: "railway", value: "tram_stop", subtype: "tram_stop" },
  { key: "railway", value: "subway_entrance", subtype: "metro" },
  { key: "railway", value: "station", subtype: "rail_station" },
  { key: "highway", value: "bus_stop", subtype: "bus_stop" },
  { key: "public_transport", value: "platform", subtype: "platform" },
];

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readExistingOutput() {
  try {
    const existing = JSON.parse(await readFile(OUTPUT_FILE, "utf8"));
    return Array.isArray(existing) ? existing : [];
  } catch {
    return [];
  }
}

async function writeOutputFile() {
  if (!WRITE_FILE) return;
  await mkdir(OUTPUT_DIR, { recursive: true });
  const json = `${JSON.stringify(output, null, 2)}\n`;
  await writeFile(OUTPUT_FILE, json, "utf8");
  if (GROUP === "major") {
    await writeFile(LEGACY_MAJOR_OUTPUT_FILE, json, "utf8");
  }
}

function overpassQuery(target, category) {
  const filters = categoryConfig[category]
    .map(([key, value]) => {
      const filter = `["${key}"="${value}"](around:${target.radiusMeters},${target.lat},${target.lng});`;
      return `node${filter}way${filter}relation${filter}`;
    })
    .join("");

  return `[out:json][timeout:35];(${filters});out center tags;`;
}

function overpassAllCategoriesQuery(target) {
  const filters = Object.values(categoryConfig)
    .flat()
    .map(([key, value]) => {
      const filter = `["${key}"="${value}"](around:${target.radiusMeters},${target.lat},${target.lng});`;
      return `node${filter}way${filter}relation${filter}`;
    })
    .join("");

  return `[out:json][timeout:45];(${filters});out center tags;`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": "universiteatlasi-map-pipeline/1.0 (local development)",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }

  return response.json();
}

async function resolveLocation(target) {
  if (target.useFallback) {
    return {
      lat: target.fallback.lat,
      lng: target.fallback.lng,
      externalId: `fallback/${target.id}`,
      displayName: target.campusName,
      locationSource: "fallback",
    };
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", target.nominatimQuery);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "tr");

  try {
    const results = await fetchJson(url);
    const first = Array.isArray(results) ? results[0] : null;
    if (first?.lat && first?.lon) {
      return {
        lat: Number(first.lat),
        lng: Number(first.lon),
        externalId: `nominatim/${first.osm_type}/${first.osm_id}`,
        displayName: first.display_name,
        locationSource: "nominatim",
      };
    }
  } catch (error) {
    console.error(`Nominatim lookup failed for ${target.dbName}: ${error.message}`);
  }

  const cityLocation = await resolveCityLocation(target);
  if (cityLocation) {
    return cityLocation;
  }

  if (!target.fallback?.lat || !target.fallback?.lng) {
    return null;
  }

  return {
    lat: target.fallback.lat,
    lng: target.fallback.lng,
    externalId: `fallback/${target.id}`,
    displayName: target.campusName,
    locationSource: "fallback",
  };
}

async function resolveCityLocation(target) {
  if (!target.city) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${target.city}, Turkiye`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "tr");

  try {
    const results = await fetchJson(url);
    const first = Array.isArray(results) ? results[0] : null;
    if (!first?.lat || !first?.lon) return null;

    return {
      lat: Number(first.lat),
      lng: Number(first.lon),
      externalId: `city-fallback/${first.osm_type}/${first.osm_id}`,
      displayName: first.display_name,
      locationSource: "city-fallback",
    };
  } catch (error) {
    console.error(`City fallback lookup failed for ${target.dbName}: ${error.message}`);
    return null;
  }
}

async function fetchPlaces(target, category) {
  const body = new URLSearchParams({ data: overpassQuery(target, category) });
  let json = null;
  let lastError = null;

  for (let attempt = 0; attempt < OVERPASS_ENDPOINTS.length * 2; attempt += 1) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length];
    try {
      json = await fetchJson(endpoint, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      });
      break;
    } catch (error) {
      lastError = error;
      await sleep(2500 + attempt * 1200);
    }
  }

  if (!json) {
    throw lastError ?? new Error("Overpass request failed");
  }

  const byId = new Map();
  for (const element of json.elements ?? []) {
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    const name = element.tags?.name ?? element.tags?.operator ?? element.tags?.brand;
    if (!lat || !lng || !name) continue;

    const externalId = `osm/${element.type}/${element.id}`;
    if (byId.has(externalId)) continue;

    byId.set(externalId, {
      name: cleanName(name),
      category,
      subtype: category === "transport" ? transportSubtype(element.tags ?? {}) : null,
      lat: roundCoord(Number(lat)),
      lng: roundCoord(Number(lng)),
      distanceMeters: Math.round(distanceMeters(target.lat, target.lng, Number(lat), Number(lng))),
      externalId,
    });
  }

  return dedupePlaces([...byId.values()])
    .sort((a, b) => a.distanceMeters - b.distanceMeters || a.name.localeCompare(b.name, "tr"))
    .slice(0, 5);
}

async function fetchAllPlaces(target) {
  const body = new URLSearchParams({ data: overpassAllCategoriesQuery(target) });
  let json = null;
  let lastError = null;

  for (let attempt = 0; attempt < OVERPASS_ENDPOINTS.length * 2; attempt += 1) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length];
    try {
      json = await fetchJson(endpoint, {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      });
      break;
    } catch (error) {
      lastError = error;
      await sleep(2500 + attempt * 1200);
    }
  }

  if (!json) {
    throw lastError ?? new Error("Overpass request failed");
  }

  const placesByCategory = new Map(Object.keys(categoryConfig).map((category) => [category, []]));
  const byId = new Set();
  for (const element of json.elements ?? []) {
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    const name = element.tags?.name ?? element.tags?.operator ?? element.tags?.brand;
    if (!lat || !lng || !name) continue;

    const category = categoryForTags(element.tags ?? {});
    if (!category) continue;

    const externalId = `osm/${element.type}/${element.id}`;
    if (byId.has(externalId)) continue;
    byId.add(externalId);

    placesByCategory.get(category).push({
      name: cleanName(name),
      category,
      subtype: category === "transport" ? transportSubtype(element.tags ?? {}) : null,
      lat: roundCoord(Number(lat)),
      lng: roundCoord(Number(lng)),
      distanceMeters: Math.round(distanceMeters(target.lat, target.lng, Number(lat), Number(lng))),
      externalId,
    });
  }

  return [...placesByCategory.values()].flatMap((places) =>
    dedupePlaces(places)
      .sort((a, b) => a.distanceMeters - b.distanceMeters || a.name.localeCompare(b.name, "tr"))
      .slice(0, 5)
  );
}

function categoryForTags(tags) {
  const orderedCategories = ["dormitory", "transport", "library", "market", "cafe", "food"];
  return orderedCategories.find((category) =>
    categoryConfig[category].some(([key, value]) => tags[key] === value)
  );
}

function dedupePlaces(places) {
  const byKey = new Map();
  for (const place of places) {
    const key = `${place.category}|${place.subtype ?? ""}|${normalizeName(place.name)}`;
    const existing = byKey.get(key);
    if (!existing || place.distanceMeters < existing.distanceMeters) {
      byKey.set(key, place);
    }
  }
  return [...byKey.values()];
}

function normalizeName(value) {
  return String(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function transportSubtype(tags) {
  const match = transportSubtypes.find((item) => tags[item.key] === item.value);
  return match?.subtype ?? "platform";
}

function cleanName(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function roundCoord(value) {
  return Number(value.toFixed(7));
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

for (const baseTarget of targets) {
  if (completedIds.has(baseTarget.id)) {
    console.error(`Skipping completed target ${baseTarget.dbName}`);
    continue;
  }

  await sleep(1100);
  const location = await resolveLocation(baseTarget);
  if (!location) {
    console.error(`Location lookup skipped for ${baseTarget.dbName}: Nominatim did not return a coordinate and no fallback is defined.`);
    continue;
  }
  const target = {
    ...baseTarget,
    lat: roundCoord(location.lat),
    lng: roundCoord(location.lng),
  };

  let places = [];
  await sleep(1600);
  try {
    places = await fetchAllPlaces(target);
  } catch (error) {
    console.error(`Overpass lookup failed for ${target.dbName}: ${error.message}`);
  }

  output.push({
    id: target.id,
    universityName: target.dbName,
    campusName: target.campusName,
    lat: target.lat,
    lng: target.lng,
    radiusMeters: target.radiusMeters,
    source: SOURCE,
    sourceDate: SOURCE_DATE,
    confidence: GROUP === "all" ? "OSM_AUTO" : "PILOT",
    locationExternalId: location.externalId,
    locationDisplayName: location.displayName,
    locationSource: location.locationSource,
    places,
  });
  completedIds.add(target.id);
  await writeOutputFile();
  console.error(`Wrote ${output.length}/${targets.length}: ${target.dbName}`);
}

const json = JSON.stringify(output, null, 2);
if (WRITE_FILE) {
  await writeOutputFile();
  console.error(`Wrote ${OUTPUT_FILE}`);
}

process.stdout.write(`${json}\n`);
