import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const BASE_URL = process.env.YOKATLAS_BASE_URL ?? "https://yokatlas.yok.gov.tr";
const PAGE_SIZE = Number(process.env.YOKATLAS_PAGE_SIZE ?? 500);
const MIN_PROGRAMS = Number(process.env.YOKATLAS_MIN_PROGRAMS ?? 10_000);
const MODE = process.env.YOKATLAS_IMPORT_MODE ?? "snapshot";
const IMPORT_APPROVED = process.env.YOKATLAS_IMPORT_APPROVED === "true";
const SNAPSHOT_PATH = process.env.YOKATLAS_SNAPSHOT_PATH
  ? resolve(process.env.YOKATLAS_SNAPSHOT_PATH)
  : resolve("database", "snapshots", `yokatlas-lisans-${new Date().toISOString().replaceAll(":", "-")}.json`);
const MAX_PAGES_PER_SCORE = process.env.YOKATLAS_MAX_PAGES_PER_SCORE
  ? Number(process.env.YOKATLAS_MAX_PAGES_PER_SCORE)
  : null;
const SCORE_TYPES = [
  { api: "SAY", db: "SAY", required: true },
  { api: "EA", db: "EA", required: true },
  { api: "S\u00d6Z", db: "SOZ", required: true },
  { api: "D\u0130L", db: "DIL", required: true },
  { api: "TYT", db: "TYT", required: false },
];

function sql(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function jsonb(value) {
  return `${sql(JSON.stringify(value ?? null))}::jsonb`;
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  let text = String(value).trim().replace(/\s+/g, "");
  if (!text || ["-", "dolmad\u0131", "dolmadi"].includes(text.toLocaleLowerCase("tr-TR"))) return null;

  if (text.includes(",")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else {
    const dotCount = (text.match(/\./g) ?? []).length;
    if (dotCount > 1) text = text.replace(/\./g, "");
  }

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function intOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function scoreType(value) {
  const normalized = String(value ?? "").trim().toLocaleUpperCase("tr-TR");
  if (normalized === "S\u00d6Z") return "SOZ";
  if (normalized === "D\u0130L") return "DIL";
  return normalized || "SAY";
}

function teachingType(value) {
  const normalized = String(value ?? "").toLocaleLowerCase("tr-TR");
  if (normalized.includes("ikinci")) return "IKINDI";
  if (normalized.includes("uzaktan")) return "UZAKTAN";
  return "ORGUNLU";
}

function scholarshipRate(value) {
  const text = String(value ?? "").toLocaleLowerCase("tr-TR");
  if (text.includes("burslu") && !text.includes("%")) return 100;
  const match = text.match(/% ?(\d+)/);
  return match ? Number(match[1]) : 0;
}

function regionForCity(city) {
  const c = String(city ?? "").toLocaleUpperCase("tr-TR");
  const regions = {
    MARMARA: ["\u0130STANBUL", "ED\u0130RNE", "KIRKLAREL\u0130", "TEK\u0130RDA\u011e", "KOCAEL\u0130", "SAKARYA", "YALOVA", "BURSA", "BALIKES\u0130R", "\u00c7ANAKKALE", "B\u0130LEC\u0130K"],
    EGE: ["\u0130ZM\u0130R", "MAN\u0130SA", "AYDIN", "DEN\u0130ZL\u0130", "MU\u011eLA", "AFYONKARAH\u0130SAR", "K\u00dcTAHYA", "U\u015eAK"],
    AKDENIZ: ["ANTALYA", "ISPARTA", "BURDUR", "ADANA", "MERS\u0130N", "HATAY", "OSMAN\u0130YE", "KAHRAMANMARA\u015e"],
    IC_ANADOLU: ["ANKARA", "ESK\u0130\u015eEH\u0130R", "KONYA", "KARAMAN", "AKSARAY", "N\u0130\u011eDE", "NEV\u015eEH\u0130R", "KIRIKKALE", "KIR\u015eEH\u0130R", "KAYSER\u0130", "S\u0130VAS", "YOZGAT", "\u00c7ANKIRI"],
    KARADENIZ: ["BOLU", "D\u00dcZCE", "ZONGULDAK", "KARAB\u00dcK", "BARTIN", "KASTAMONU", "S\u0130NOP", "SAMSUN", "AMASYA", "\u00c7ORUM", "TOKAT", "ORDU", "G\u0130RESUN", "TRABZON", "R\u0130ZE", "ARTV\u0130N", "G\u00dcM\u00dc\u015eHANE", "BAYBURT"],
    DOGU_ANADOLU: ["ERZURUM", "ERZ\u0130NCAN", "A\u011eRI", "KARS", "I\u011eDIR", "ARDAHAN", "VAN", "HAKKAR\u0130", "B\u0130TL\u0130S", "MU\u015e", "B\u0130NG\u00d6L", "ELAZI\u011e", "MALATYA", "TUNCEL\u0130"],
    GUNEYDOGU_ANADOLU: ["GAZ\u0130ANTEP", "K\u0130L\u0130S", "ADIYAMAN", "\u015eANLIURFA", "D\u0130YARBAKIR", "MARD\u0130N", "BATMAN", "S\u0130\u0130RT", "\u015eIRNAK"],
  };
  for (const [region, cities] of Object.entries(regions)) {
    if (cities.includes(c)) return region;
  }
  return c ? "YURT_DISI" : "BILINMIYOR";
}

function cleanName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function isExcludedUniversityCity(city) {
  const normalized = cleanName(city).toLocaleUpperCase("tr-TR");
  return normalized === "KIBRIS" || normalized === "BILINMIYOR";
}

function yearRows(program) {
  const currentYear = intOrNull(program.yil) ?? 2025;
  const rows = [{
    year: currentYear,
    yearQuota: intOrNull(program.kontenjan),
    baseScore: numberOrNull(program.minPuan),
    baseRank: intOrNull(program.basariSirasi),
    placed: intOrNull(program.gkY),
    registered: intOrNull(program.kayitYaptiran ?? program.kayitYaptiranSayisi ?? program.kayitY),
    additionalPlaced: intOrNull(program.ekYerlesen ?? program.ekYerlesenSayisi),
    additionalRegistered: intOrNull(program.ekKayitYaptiran ?? program.ekKayitYaptiranSayisi),
    remaining: null,
  }];

  for (const offset of [1, 2, 3]) {
    rows.push({
      year: currentYear - offset,
      yearQuota: intOrNull(program[`kontenjan${offset}`]),
      baseScore: numberOrNull(program[`minPuan${offset}`]),
      baseRank: intOrNull(program[`basariSirasi${offset}`]),
      placed: intOrNull(program[`gk${offset}`]),
      registered: intOrNull(program[`kayitYaptiran${offset}`] ?? program[`kayitY${offset}`]),
      additionalPlaced: intOrNull(program[`ekYerlesen${offset}`]),
      additionalRegistered: intOrNull(program[`ekKayitYaptiran${offset}`]),
      remaining: null,
    });
  }

  return rows.filter((row) => row.baseScore !== null || row.baseRank !== null || row.placed !== null);
}

function requestBody(score, page) {
  return {
    filters: {
      puanTuru: score,
      universiteId: [],
      birimGrupId: [],
      ilKodu: [],
      birimTuruId: 46,
      universiteTuru: null,
      bursOraniId: null,
      ogrenimTuruId: null,
      kilavuzKodu: null,
      minBasariSirasi: null,
      maxBasariSirasi: null,
    },
    page,
    size: PAGE_SIZE,
    sortBy: "basariSirasi",
    direction: "ASC",
  };
}

async function fetchPage(score, page, attempt = 1) {
  const response = await fetch(`${BASE_URL}/api/tercih-kilavuz/search`, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      Origin: BASE_URL,
      Referer: `${BASE_URL}/`,
      "User-Agent": "Mozilla/5.0 UniversiteAtlasiDataImporter/1.0",
    },
    body: JSON.stringify(requestBody(score, page)),
  });

  if (!response.ok) {
    if (attempt < 3 && [403, 408, 429, 500, 502, 503, 504].includes(response.status)) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      return fetchPage(score, page, attempt + 1);
    }
    throw new Error(`YOK Atlas API ${score} page ${page} failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchAllPrograms() {
  const byCode = new Map();
  const stats = [];

  for (const score of SCORE_TYPES) {
    let page = 0;
    let totalPages = 1;
    let scoreRows = 0;

    while (page < totalPages && (MAX_PAGES_PER_SCORE === null || page < MAX_PAGES_PER_SCORE)) {
      const data = await fetchPage(score.api, page);
      totalPages = Number(data.totalPages ?? 0);
      const content = Array.isArray(data.content) ? data.content : [];

      for (const program of content) {
        if (!program.kilavuzKodu) continue;
        byCode.set(String(program.kilavuzKodu), program);
      }

      scoreRows += content.length;
      console.log(`${score.api}: page ${page + 1}/${totalPages}, score rows ${scoreRows}, unique rows ${byCode.size}`);
      if (totalPages === 0) break;
      page += 1;
    }

    if (score.required && scoreRows === 0) {
      throw new Error(`YOK Atlas returned zero rows for required score type ${score.api}.`);
    }
    stats.push({ ...score, upstreamRows: scoreRows, totalPages, fetchedPages: page });
  }

  return { programs: [...byCode.values()], stats };
}

async function loadOrFetchPrograms() {
  if (process.env.YOKATLAS_SNAPSHOT_PATH) {
    const snapshot = JSON.parse(await readFile(SNAPSHOT_PATH, "utf8"));
    return { programs: snapshot.programs ?? [], stats: snapshot.stats ?? [] };
  }
  return fetchAllPrograms();
}

async function writeSnapshot(programs, stats) {
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    source: BASE_URL,
    pageSize: PAGE_SIZE,
    maxPagesPerScore: MAX_PAGES_PER_SCORE,
    programCount: programs.length,
    stats,
    programs,
  };
  await mkdir(dirname(SNAPSHOT_PATH), { recursive: true });
  await writeFile(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2), "utf8");
  return SNAPSHOT_PATH;
}

function buildSql(programs, stats) {
  const universities = new Map();
  const yearlyRows = [];
  let importedPrograms = 0;
  let skippedPrograms = 0;
  let skippedExcludedPrograms = 0;

  for (const program of programs) {
    const id = intOrNull(program.universiteId);
    if (!id || universities.has(id)) continue;
    const city = cleanName(program.uniIlAdi ?? program.ilAdi ?? "BILINMIYOR");
    if (isExcludedUniversityCity(city)) continue;
    universities.set(id, {
      id,
      name: cleanName(program.universiteAdi),
      city,
      region: regionForCity(city),
      type: program.universiteTuru === "VAKIF" ? "VAKIF" : "DEVLET",
    });
  }

  const lines = [
    "BEGIN;",
    "SET CONSTRAINTS ALL DEFERRED;",
    "INSERT INTO yokatlas_import_audit (kaynak, kaynak_url, veri_kategorisi, durum, mesaj) VALUES ('YOK_ATLAS', " +
      `${sql(BASE_URL)}, 'LISANS', 'STARTED', 'Snapshot upsert started');`,
  ];

  for (const u of universities.values()) {
    lines.push(
      `INSERT INTO universitetler (id, ad, sehir, bolge, tur, slug) VALUES (${u.id}, ${sql(u.name)}, ${sql(u.city)}, ${sql(u.region)}, ${sql(u.type)}, ${sql(String(u.id))}) ` +
        `ON CONFLICT (id) DO UPDATE SET ` +
        `ad = EXCLUDED.ad, sehir = EXCLUDED.sehir, bolge = EXCLUDED.bolge, tur = EXCLUDED.tur, slug = EXCLUDED.slug;`
    );
  }

  for (const program of programs) {
    const programId = intOrNull(program.kilavuzKodu);
    const universityId = intOrNull(program.universiteId);
    if (!programId || !universityId || !universities.has(universityId)) {
      skippedPrograms += 1;
      const city = cleanName(program.uniIlAdi ?? program.ilAdi ?? "BILINMIYOR");
      if (isExcludedUniversityCity(city)) skippedExcludedPrograms += 1;
      continue;
    }

    const quota = intOrNull(program.kontenjan) ?? 0;
    const tuition = numberOrNull(program.ucret);
    importedPrograms += 1;
    lines.push(
      `INSERT INTO lisans_programlari (` +
        `id, universite_id, fakulte, program_adi, puan_turu, ogretim_turu, kontenjan, burs_orani, ucret, ` +
        `program_kodu, dil, ogretim_suresi_yil, detail_url, yokatlas_universite_id, yokatlas_il_kodu, ` +
        `yokatlas_program_grup_id, program_grup_adi, birim_turu_id, birim_turu_adi, ogrenim_turu_id, ` +
        `ogrenim_turu_adi, burs_orani_id, burs_orani_adi, osym_kilavuz_id, eski_kilavuz_kodu, eski_birim_id, ` +
        `fymk_id, fymk_il_kodu, fymk_il_adi, fymk_ilce_kodu, fymk_ilce_adi, ilce_kodu, ilce_adi, ` +
        `akreditasyon, akreditasyon_ack, uni_akreditasyon, kosul, kosul_list, min_basari_sirasi, ` +
        `min_basari_sirasi_kosul, kontenjan_y34, kontenjan_dep, kontenjan_meb, kontenjan_obs, kontenjan_sgy, ` +
        `prof_sayisi, doc_sayisi, dou_sayisi, ogr_gor_sayisi, ar_gor_sayisi, yokatlas_raw` +
      `) VALUES (` +
        [
          programId,
          universityId,
          sql(cleanName(program.fymkAdi ?? "Birim")),
          sql(cleanName(program.birimAdi)),
          sql(scoreType(program.puanTuru)),
          sql(teachingType(program.ogrenimTuruAdi)),
          quota,
          scholarshipRate(program.bursOraniAdi),
          sql(tuition),
          sql(String(programId)),
          sql(cleanName(program.ogrenimDiliAdi)),
          sql(intOrNull(program.ogrenimSuresi)),
          sql(`${BASE_URL}/lisans.php?y=${programId}`),
          sql(intOrNull(program.universiteId)),
          sql(cleanName(program.uniIlKodu ?? program.ilKodu)),
          sql(cleanName(program.birimGrupId)),
          sql(cleanName(program.birimGrupAdi)),
          sql(intOrNull(program.birimTuruId)),
          sql(cleanName(program.birimTuruAdi)),
          sql(intOrNull(program.ogrenimTuruId)),
          sql(cleanName(program.ogrenimTuruAdi)),
          sql(intOrNull(program.bursOraniId)),
          sql(cleanName(program.bursOraniAdi)),
          sql(intOrNull(program.osymKilavuzId)),
          sql(cleanName(program.eskiKilavuzKodu)),
          sql(intOrNull(program.eskiBirimId)),
          sql(intOrNull(program.fymkId)),
          sql(cleanName(program.fymkIlKodu)),
          sql(cleanName(program.fymkIlAdi)),
          sql(cleanName(program.fymkIlceKodu)),
          sql(cleanName(program.fymkIlceAdi)),
          sql(cleanName(program.ilceKodu)),
          sql(cleanName(program.ilceAdi)),
          sql(cleanName(program.akreditasyon)),
          sql(cleanName(program.akreditasyonAck)),
          sql(cleanName(program.uniAkreditasyon)),
          sql(cleanName(program.kosul)),
          jsonb(program.kosulList ?? []),
          sql(intOrNull(program.minBasariSirasi)),
          sql(cleanName(program.minBasariSirasiKosul)),
          sql(intOrNull(program.kontenjanY34)),
          sql(intOrNull(program.kontenjanDep)),
          sql(intOrNull(program.kontenjanMeb)),
          sql(intOrNull(program.kontenjanObs)),
          sql(intOrNull(program.kontenjanSgy)),
          sql(intOrNull(program.prof)),
          sql(intOrNull(program.doc)),
          sql(intOrNull(program.dou)),
          sql(intOrNull(program.ogrGor)),
          sql(intOrNull(program.arGor)),
          jsonb(program),
        ].join(", ") +
        `) ON CONFLICT (program_kodu) DO UPDATE SET ` +
        `id = EXCLUDED.id, ` +
        `universite_id = EXCLUDED.universite_id, ` +
        `fakulte = EXCLUDED.fakulte, ` +
        `program_adi = EXCLUDED.program_adi, ` +
        `puan_turu = EXCLUDED.puan_turu, ` +
        `ogretim_turu = EXCLUDED.ogretim_turu, ` +
        `kontenjan = EXCLUDED.kontenjan, ` +
        `burs_orani = EXCLUDED.burs_orani, ` +
        `ucret = EXCLUDED.ucret, ` +
        `dil = EXCLUDED.dil, ` +
        `ogretim_suresi_yil = EXCLUDED.ogretim_suresi_yil, ` +
        `detail_url = EXCLUDED.detail_url, ` +
        `yokatlas_universite_id = EXCLUDED.yokatlas_universite_id, ` +
        `yokatlas_il_kodu = EXCLUDED.yokatlas_il_kodu, ` +
        `yokatlas_program_grup_id = EXCLUDED.yokatlas_program_grup_id, ` +
        `program_grup_adi = EXCLUDED.program_grup_adi, ` +
        `birim_turu_id = EXCLUDED.birim_turu_id, ` +
        `birim_turu_adi = EXCLUDED.birim_turu_adi, ` +
        `ogrenim_turu_id = EXCLUDED.ogrenim_turu_id, ` +
        `ogrenim_turu_adi = EXCLUDED.ogrenim_turu_adi, ` +
        `burs_orani_id = EXCLUDED.burs_orani_id, ` +
        `burs_orani_adi = EXCLUDED.burs_orani_adi, ` +
        `osym_kilavuz_id = EXCLUDED.osym_kilavuz_id, ` +
        `eski_kilavuz_kodu = EXCLUDED.eski_kilavuz_kodu, ` +
        `eski_birim_id = EXCLUDED.eski_birim_id, ` +
        `fymk_id = EXCLUDED.fymk_id, ` +
        `fymk_il_kodu = EXCLUDED.fymk_il_kodu, ` +
        `fymk_il_adi = EXCLUDED.fymk_il_adi, ` +
        `fymk_ilce_kodu = EXCLUDED.fymk_ilce_kodu, ` +
        `fymk_ilce_adi = EXCLUDED.fymk_ilce_adi, ` +
        `ilce_kodu = EXCLUDED.ilce_kodu, ` +
        `ilce_adi = EXCLUDED.ilce_adi, ` +
        `akreditasyon = EXCLUDED.akreditasyon, ` +
        `akreditasyon_ack = EXCLUDED.akreditasyon_ack, ` +
        `uni_akreditasyon = EXCLUDED.uni_akreditasyon, ` +
        `kosul = EXCLUDED.kosul, ` +
        `kosul_list = EXCLUDED.kosul_list, ` +
        `min_basari_sirasi = EXCLUDED.min_basari_sirasi, ` +
        `min_basari_sirasi_kosul = EXCLUDED.min_basari_sirasi_kosul, ` +
        `kontenjan_y34 = EXCLUDED.kontenjan_y34, ` +
        `kontenjan_dep = EXCLUDED.kontenjan_dep, ` +
        `kontenjan_meb = EXCLUDED.kontenjan_meb, ` +
        `kontenjan_obs = EXCLUDED.kontenjan_obs, ` +
        `kontenjan_sgy = EXCLUDED.kontenjan_sgy, ` +
        `prof_sayisi = EXCLUDED.prof_sayisi, ` +
        `doc_sayisi = EXCLUDED.doc_sayisi, ` +
        `dou_sayisi = EXCLUDED.dou_sayisi, ` +
        `ogr_gor_sayisi = EXCLUDED.ogr_gor_sayisi, ` +
        `ar_gor_sayisi = EXCLUDED.ar_gor_sayisi, ` +
        `yokatlas_raw = EXCLUDED.yokatlas_raw;`
    );

    for (const row of yearRows(program)) {
      yearlyRows.push(row);
      lines.push(
        `INSERT INTO lisans_yil_verileri (` +
          `program_id, yil, taban_puan, taban_sira, tavan_puan, tavan_sira, yerlesen, bos_kalan, ` +
          `yil_kontenjan, kayit_yaptiran, ek_yerlesen, ek_kayit_yaptiran` +
        `) VALUES (` +
          [
            programId,
            row.year,
            sql(row.baseScore),
            sql(row.baseRank),
            "NULL",
            "NULL",
            sql(row.placed),
            sql(row.remaining),
            sql(row.yearQuota),
            sql(row.registered),
            sql(row.additionalPlaced),
            sql(row.additionalRegistered),
          ].join(", ") +
          `) ON CONFLICT (program_id, yil) DO UPDATE SET ` +
          `taban_puan = EXCLUDED.taban_puan, ` +
          `taban_sira = EXCLUDED.taban_sira, ` +
          `tavan_puan = EXCLUDED.tavan_puan, ` +
          `tavan_sira = EXCLUDED.tavan_sira, ` +
          `yerlesen = EXCLUDED.yerlesen, ` +
          `bos_kalan = EXCLUDED.bos_kalan, ` +
          `yil_kontenjan = EXCLUDED.yil_kontenjan, ` +
          `kayit_yaptiran = EXCLUDED.kayit_yaptiran, ` +
          `ek_yerlesen = EXCLUDED.ek_yerlesen, ` +
          `ek_kayit_yaptiran = EXCLUDED.ek_kayit_yaptiran;`
      );
    }
  }

  lines.push(
    "SELECT setval('universitetler_id_seq', COALESCE((SELECT MAX(id) FROM universitetler), 1), true);",
    "SELECT setval('lisans_programlari_id_seq', COALESCE((SELECT MAX(id) FROM lisans_programlari), 1), true);",
    "SELECT setval('lisans_yil_verileri_id_seq', COALESCE((SELECT MAX(id) FROM lisans_yil_verileri), 1), true);",
    validationSql(importedPrograms, universities.size, yearlyRows.length, stats),
    "UPDATE yokatlas_import_audit SET durum = 'SUCCESS', kayit_sayisi = " + importedPrograms + ", bitis_tarihi = NOW(), mesaj = 'Snapshot upsert completed' " +
      "WHERE id = (SELECT MAX(id) FROM yokatlas_import_audit WHERE kaynak = 'YOK_ATLAS' AND veri_kategorisi = 'LISANS');",
    "COMMIT;"
  );

  return {
    sqlText: lines.join("\n"),
    importedPrograms,
    skippedPrograms,
    skippedExcludedPrograms,
    yearlyRows: yearlyRows.length,
    universities: universities.size,
  };
}

function validationSql(expectedPrograms, expectedUniversities, expectedYearlyRows, stats) {
  const expectedScoreCounts = stats
    .map((s) => `('${s.db}', ${s.upstreamRows}, ${s.required ? "TRUE" : "FALSE"})`)
    .join(", ");

  return `
DO $$
DECLARE
  program_count INTEGER;
  university_count INTEGER;
  yearly_count INTEGER;
  orphan_programs INTEGER;
  orphan_years INTEGER;
  missing_required_scores INTEGER;
BEGIN
  SELECT COUNT(*) INTO program_count FROM lisans_programlari;
  SELECT COUNT(*) INTO university_count FROM universitetler;
  SELECT COUNT(*) INTO yearly_count FROM lisans_yil_verileri;
  SELECT COUNT(*) INTO orphan_programs FROM lisans_programlari p LEFT JOIN universitetler u ON u.id = p.universite_id WHERE u.id IS NULL;
  SELECT COUNT(*) INTO orphan_years FROM lisans_yil_verileri y LEFT JOIN lisans_programlari p ON p.id = y.program_id WHERE p.id IS NULL;

  WITH expected(score_type, upstream_rows, required) AS (VALUES ${expectedScoreCounts})
  SELECT COUNT(*) INTO missing_required_scores
  FROM expected e
  WHERE e.required
    AND e.upstream_rows > 0
    AND NOT EXISTS (SELECT 1 FROM lisans_programlari p WHERE p.puan_turu = e.score_type);

  IF program_count < ${MIN_PROGRAMS} THEN
    RAISE EXCEPTION 'Imported program count % is lower than minimum ${MIN_PROGRAMS}', program_count;
  END IF;
  IF program_count < ${expectedPrograms} THEN
    RAISE EXCEPTION 'Imported program count % does not match fetched unique count ${expectedPrograms}', program_count;
  END IF;
  IF university_count < ${expectedUniversities} THEN
    RAISE EXCEPTION 'Imported university count % does not match built count ${expectedUniversities}', university_count;
  END IF;
  IF yearly_count < ${expectedYearlyRows} THEN
    RAISE EXCEPTION 'Imported yearly row count % does not match built count ${expectedYearlyRows}', yearly_count;
  END IF;
  IF orphan_programs <> 0 OR orphan_years <> 0 THEN
    RAISE EXCEPTION 'Import created orphan rows: programs %, years %', orphan_programs, orphan_years;
  END IF;
  IF missing_required_scores <> 0 THEN
    RAISE EXCEPTION 'Import is missing one or more required score types';
  END IF;

  RAISE NOTICE 'Validated import: % universities, % programs, % yearly rows', university_count, program_count, yearly_count;
END $$;`;
}

function runPsql(sqlText) {
  return spawnSync(
    "docker",
    ["compose", "exec", "-T", "postgres", "psql", "-q", "-U", "postgres", "-d", "universiteatlasi", "-v", "ON_ERROR_STOP=1"],
    { input: sqlText, cwd: new URL("..", import.meta.url), encoding: "utf8", maxBuffer: 1024 * 1024 * 50 }
  );
}

if (!["snapshot", "plan", "import"].includes(MODE)) {
  throw new Error(`Unsupported YOKATLAS_IMPORT_MODE=${MODE}. Use snapshot, plan, or import.`);
}

const { programs, stats } = await loadOrFetchPrograms();
console.log(`Fetched ${programs.length} unique LISANS programs.`);
console.table(stats.map(({ api, db, required, upstreamRows, totalPages }) => ({ api, db, required, upstreamRows, totalPages })));

if (MODE === "snapshot") {
  const path = await writeSnapshot(programs, stats);
  console.log(`Wrote YOK Atlas snapshot without touching PostgreSQL: ${path}`);
  process.exit(0);
}

const { sqlText, importedPrograms, skippedPrograms, skippedExcludedPrograms, yearlyRows, universities } = buildSql(programs, stats);
console.log(`Prepared non-destructive upsert plan: ${universities} universities, ${importedPrograms} imported programs, ${yearlyRows} yearly rows, ${skippedPrograms} skipped programs (${skippedExcludedPrograms} Cyprus/abroad).`);

if (MODE === "plan") {
  console.log("Plan mode completed without touching PostgreSQL.");
  process.exit(0);
}

if (!IMPORT_APPROVED) {
  throw new Error("Refusing database upsert without YOKATLAS_IMPORT_APPROVED=true. Snapshot and plan modes do not write to PostgreSQL.");
}

if (importedPrograms < MIN_PROGRAMS) {
  throw new Error(`Prepared ${importedPrograms} importable programs, below YOKATLAS_MIN_PROGRAMS=${MIN_PROGRAMS}. Refusing destructive import.`);
}

const result = runPsql(sqlText);
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.status !== 0) process.exit(result.status ?? 1);

console.log(`Upserted and validated ${importedPrograms} programs into Docker PostgreSQL without truncating user or preference tables.`);
