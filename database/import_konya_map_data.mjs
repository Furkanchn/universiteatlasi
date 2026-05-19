#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const SOURCE = "OpenStreetMap / Nominatim / Overpass";
const SOURCE_DATE = "2026-05-15";
const CONFIDENCE = "PILOT";

const data = [
  {
    id: 241176, name: "KONYA GIDA VE TARIM ÜNİVERSİTESİ", lat: 37.8746284, lng: 32.4739562,
    places: [
      ["Ali Baba 2 Firin Kebap", "food", 37.8773172, 32.4824245, 801],
      ["Burger King", "food", 37.8783458, 32.4840925, 981],
      ["Iconium Pizza", "food", 37.8707233, 32.4850316, 1065],
      ["Meşhur Tiritçi Kabakçı Ali", "food", 37.8739957, 32.486294, 1085],
      ["Tavuk Dünyası", "food", 37.8707145, 32.4860212, 1145],
      ["Konevi Çay Evi", "cafe", 37.8687861, 32.4818918, 952],
      ["Cadde İstasyon", "cafe", 37.8694087, 32.4847355, 1110],
      ["Osmanlı Nargile", "cafe", 37.8672903, 32.4641371, 1187],
      ["Kocatepe Meram", "cafe", 37.8672766, 32.4636885, 1217],
      ["Dervish Brothers Hostel", "dormitory", 37.8694992, 32.5033193, 2640],
      ["Makromarket", "market", 37.8783972, 32.4841414, 987],
      ["Şok", "market", 37.8843899, 32.4771856, 1122],
      ["Simit Fırını", "market", 37.8719467, 32.4864773, 1139],
      ["BİM", "market", 37.8847042, 32.477735, 1168],
      ["Kültürpark Turnike 2", "transport", 37.8737642, 32.4887875, 1305],
      ["Rauf Denktaş", "transport", 37.882917, 32.4873099, 1491],
      ["Parsana", "transport", 37.8815097, 32.4902276, 1620],
      ["Evliya Çelebi Parkı", "transport", 37.8656531, 32.4580263, 1718],
    ],
  },
  {
    id: 339979, name: "KONYA TEKNİK ÜNİVERSİTESİ", lat: 38.0063993, lng: 32.5152564,
    places: [
      ["McDonald's", "food", 38.0091583, 32.5209299, 584],
      ["Burger King", "food", 38.0102533, 32.520934, 657],
      ["Köfteci Yusuf", "food", 38.0103793, 32.5219454, 734],
      ["Rolik sushi Konya", "food", 37.9881085, 32.5120283, 2053],
      ["Mackbear Coffee", "cafe", 38.0092877, 32.5215907, 641],
      ["LUPEN", "cafe", 38.0101346, 32.5208587, 643],
      ["Starbucks", "cafe", 38.010377, 32.5220607, 742],
      ["Yemen Cafe", "cafe", 38.0105617, 32.521928, 746],
      ["Atatürk Öğrenci Yurtları", "dormitory", 38.0150474, 32.5098753, 1071],
      ["KYK Cumhuriyet Yurdu", "dormitory", 38.0148688, 32.5093026, 1077],
      ["Alaaddin Öğrenci Yurdu", "dormitory", 38.0197151, 32.5051866, 1724],
      ["Migros", "market", 38.0106804, 32.5231799, 842],
      ["BİM", "market", 38.0104867, 32.5238988, 883],
      ["Çelikkayalar", "market", 38.0096968, 32.5250389, 932],
      ["Kılıçarslan Gençlik Merkezi", "transport", 38.0096141, 32.5203219, 570],
      ["Akif", "transport", 38.0091248, 32.5231273, 753],
      ["Bosna Pazar", "transport", 38.0118447, 32.5219269, 842],
      ["Yeni Nesil Şehir Kütüphanesi", "library", 38.0090246, 32.5245151, 862],
    ],
  },
  {
    id: 166433, name: "KTO KARATAY ÜNİVERSİTESİ", lat: 37.8648232, lng: 32.5369246,
    places: [
      ["Burger King", "food", 37.8619984, 32.5427078, 597],
      ["Köfteci Yusuf", "food", 37.8601612, 32.5426604, 723],
      ["Şehr-i Çorba", "food", 37.8596239, 32.5505084, 1325],
      ["Yaldız Yufka Börek Evi", "food", 37.8667391, 32.5168555, 1775],
      ["Dünya Mevlâna Vakfı Misafirhanesi", "dormitory", 37.872103, 32.5057711, 2852],
      ["Dervish Brothers Hostel", "dormitory", 37.8694992, 32.5033193, 2995],
      ["Adese", "market", 37.8644017, 32.5346616, 204],
      ["Emirsultan Unlu Mamülleri", "market", 37.8644089, 32.5343714, 229],
      ["My Gross", "market", 37.8667952, 32.5427028, 553],
      ["Kahraman Market", "market", 37.8558737, 32.5384253, 1004],
      ["Özbaşak", "transport", 37.8668404, 32.5373176, 227],
      ["Çifteler", "transport", 37.8667106, 32.5336791, 354],
      ["Akgöl", "transport", 37.8611511, 32.5366573, 409],
      ["Şirineli", "transport", 37.8614382, 32.5341158, 450],
      ["Yusuf Ağa Yazma Eser Kütüphanesi", "library", 37.8702691, 32.5038818, 2963],
    ],
  },
  {
    id: 173500, name: "NECMETTİN ERBAKAN ÜNİVERSİTESİ", lat: 37.8641078, lng: 32.4155536,
    places: [
      ["Akyokuş Kasrı", "food", 37.8801033, 32.4256965, 1989],
      ["Sarnıç Etli Ekmek Salonu", "food", 37.8542533, 32.4389307, 2327],
      ["Güven Balık Restoran", "food", 37.8815791, 32.4319488, 2418],
      ["Atlıhan", "food", 37.8813843, 32.4359141, 2624],
      ["Kafem", "cafe", 37.849357, 32.4177924, 1652],
      ["Kayserili Bakkal", "market", 37.8690048, 32.4354713, 1831],
      ["BİM", "market", 37.8790998, 32.4305119, 2122],
      ["Shell Select", "market", 37.8794995, 32.4314153, 2206],
      ["Köyceğiz Kampüs 2", "transport", 37.8653923, 32.4203771, 447],
      ["Çınaraltı Hareket Merkezi", "transport", 37.8535128, 32.4230507, 1349],
      ["Meram Devlet Hastanesi", "transport", 37.8619524, 32.4452009, 2614],
      ["Taşlıdağ", "transport", 37.86743, 32.4462415, 2719],
    ],
  },
  {
    id: 123902, name: "SELÇUK ÜNİVERSİTESİ", lat: 38.0242069, lng: 32.5057052,
    places: [
      ["Selçuk Üniversitesi Merkez Yemekhane", "food", 38.0251197, 32.510991, 474],
      ["Burger King", "food", 38.0102533, 32.520934, 2046],
      ["Köfteci Yusuf", "food", 38.0103793, 32.5219454, 2095],
      ["McDonald's", "food", 38.0091583, 32.5209299, 2140],
      ["Selçuk Üniversitesi Fen Edebiyat Fakültesi Kantini", "cafe", 38.025479, 32.5050436, 153],
      ["Ayışığı", "cafe", 38.0266688, 32.5098512, 455],
      ["EspressoLab", "cafe", 38.0234858, 32.5118945, 548],
      ["Alaaddin Öğrenci Yurdu", "dormitory", 38.0222521, 32.5033942, 297],
      ["Atatürk Öğrenci Yurtları", "dormitory", 38.0174046, 32.5091592, 815],
      ["KYK Cumhuriyet Yurdu", "dormitory", 38.0154009, 32.5089048, 1019],
      ["Migros", "market", 38.0127889, 32.5220251, 1912],
      ["BİM", "market", 38.0176229, 32.5273264, 2031],
      ["Furkan market", "market", 38.0149474, 32.5263339, 2080],
      ["Bosna Hersek Garajı", "transport", 38.0197498, 32.521061, 1434],
      ["Bosna Mesaj", "transport", 38.0178269, 32.5235343, 1715],
      ["Mesaj", "transport", 38.0148111, 32.5214212, 1728],
      ["Selçuk Üniversitesi Prof. Dr. Erol GÜNGÖR Kütüphanesi", "library", 38.0241782, 32.5119627, 548],
    ],
  },
];

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function transportSubtype(name, universityId) {
  const normalized = String(name).toLocaleLowerCase("tr-TR");
  if (
    normalized.includes("kültürpark") ||
    normalized.includes("rauf denktaş") ||
    normalized.includes("parsana") ||
    normalized.includes("kılıçarslan") ||
    normalized === "akif" ||
    normalized.includes("bosna hersek") ||
    normalized.includes("bosna mesaj") ||
    normalized === "mesaj"
  ) {
    return "tram_stop";
  }
  if (universityId === 339979 && normalized.includes("bosna pazar")) {
    return "bus_stop";
  }
  return "bus_stop";
}

const ids = data.map((u) => u.id).join(", ");
const lines = [
  "BEGIN;",
  `DELETE FROM nearby_places WHERE university_id IN (${ids});`,
];

for (const university of data) {
  lines.push(
    `INSERT INTO university_locations (university_id, latitude, longitude, source, source_date, confidence, updated_at) VALUES (` +
      `${university.id}, ${university.lat}, ${university.lng}, ${sql(SOURCE)}, ${sql(SOURCE_DATE)}, ${sql(CONFIDENCE)}, NOW()) ` +
      `ON CONFLICT (university_id) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, ` +
      `source = EXCLUDED.source, source_date = EXCLUDED.source_date, confidence = EXCLUDED.confidence, updated_at = NOW();`
  );

  university.places.forEach(([name, category, lat, lng, distanceMeters], index) => {
    const subtype = category === "transport" ? transportSubtype(name, university.id) : null;
    const externalId = `konya-pilot/${university.id}/${category}/${index + 1}`;
    lines.push(
      `INSERT INTO nearby_places (university_id, name, category, subtype, latitude, longitude, distance_meters, source, source_date, external_id) VALUES (` +
        `${university.id}, ${sql(name)}, ${sql(category)}, ${sql(subtype)}, ${lat}, ${lng}, ${distanceMeters}, ${sql(SOURCE)}, ${sql(SOURCE_DATE)}, ${sql(externalId)});`
    );
  });
}

lines.push(
  "COMMIT;",
  "SELECT COUNT(*) AS university_location_count FROM university_locations WHERE university_id IN (" + ids + ");",
  "SELECT COUNT(*) AS nearby_place_count FROM nearby_places WHERE university_id IN (" + ids + ");"
);

const result = spawnSync(
  "docker",
  ["compose", "exec", "-T", "postgres", "psql", "-q", "-U", "postgres", "-d", "universiteatlasi", "-v", "ON_ERROR_STOP=1"],
  { input: lines.join("\n"), cwd: new URL("..", import.meta.url), encoding: "utf8", maxBuffer: 1024 * 1024 * 10 }
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);
