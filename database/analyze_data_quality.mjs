import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const REPORT_PATH = resolve("docs", "VERI_KALITE_RAPORU.md");
const YEAR = Number(process.env.DATA_QUALITY_YEAR ?? 2025);

function runSql(sql) {
  const result = spawnSync(
    "docker",
    ["compose", "exec", "-T", "postgres", "psql", "-q", "-U", "postgres", "-d", "universiteatlasi", "-t", "-A", "-c", sql],
    { cwd: new URL("..", import.meta.url), encoding: "utf8", maxBuffer: 1024 * 1024 * 20 }
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || `psql exited with ${result.status}`);
  }
  return JSON.parse(result.stdout.trim() || "null");
}

const summary = runSql(`
WITH program AS (
  SELECT p.*, u.tur AS universite_turu, u.sehir
  FROM lisans_programlari p
  JOIN universitetler u ON u.id = p.universite_id
),
year_data AS (
  SELECT * FROM lisans_yil_verileri WHERE yil = ${YEAR}
)
SELECT jsonb_build_object(
  'year', ${YEAR},
  'universities', (SELECT COUNT(*) FROM universitetler),
  'programs', (SELECT COUNT(*) FROM program),
  'yearRows', (SELECT COUNT(*) FROM year_data),
  'fields', jsonb_build_array(
    jsonb_build_object('group','program','field','program_kodu','label','Program kodu','filled',(SELECT COUNT(*) FROM program WHERE NULLIF(program_kodu,'') IS NOT NULL)),
    jsonb_build_object('group','program','field','puan_turu','label','Puan türü','filled',(SELECT COUNT(*) FROM program WHERE puan_turu IS NOT NULL)),
    jsonb_build_object('group','program','field','ogretim_turu','label','Öğretim türü','filled',(SELECT COUNT(*) FROM program WHERE ogretim_turu IS NOT NULL)),
    jsonb_build_object('group','program','field','kontenjan','label','Kontenjan','filled',(SELECT COUNT(*) FROM program WHERE kontenjan IS NOT NULL)),
    jsonb_build_object('group','program','field','burs_orani_adi/ucret','label','Burs/ücret','filled',(SELECT COUNT(*) FROM program WHERE ucret IS NOT NULL OR NULLIF(burs_orani_adi,'') IS NOT NULL)),
    jsonb_build_object('group','program','field','dil','label','Dil','filled',(SELECT COUNT(*) FROM program WHERE NULLIF(dil,'') IS NOT NULL)),
    jsonb_build_object('group','program','field','ogretim_suresi_yil','label','Öğrenim süresi','filled',(SELECT COUNT(*) FROM program WHERE ogretim_suresi_yil IS NOT NULL)),
    jsonb_build_object('group','program','field','program_grup_adi','label','Program grubu','filled',(SELECT COUNT(*) FROM program WHERE NULLIF(program_grup_adi,'') IS NOT NULL)),
    jsonb_build_object('group','program','field','birim_turu_adi','label','Birim türü','filled',(SELECT COUNT(*) FROM program WHERE NULLIF(birim_turu_adi,'') IS NOT NULL)),
    jsonb_build_object('group','program','field','ilce_adi','label','İlçe','filled',(SELECT COUNT(*) FROM program WHERE NULLIF(ilce_adi,'') IS NOT NULL)),
    jsonb_build_object('group','year','field','taban_puan','label','Taban puan','filled',(SELECT COUNT(*) FROM year_data WHERE taban_puan IS NOT NULL)),
    jsonb_build_object('group','year','field','taban_sira','label','Taban sıra','filled',(SELECT COUNT(*) FROM year_data WHERE taban_sira IS NOT NULL)),
    jsonb_build_object('group','year','field','yerlesen','label','Yerleşen','filled',(SELECT COUNT(*) FROM year_data WHERE yerlesen IS NOT NULL)),
    jsonb_build_object('group','year','field','yil_kontenjan','label','Yıl kontenjan','filled',(SELECT COUNT(*) FROM year_data WHERE yil_kontenjan IS NOT NULL)),
    jsonb_build_object('group','year','field','tavan_puan','label','Tavan puan','filled',(SELECT COUNT(*) FROM year_data WHERE tavan_puan IS NOT NULL)),
    jsonb_build_object('group','year','field','tavan_sira','label','Tavan sıra','filled',(SELECT COUNT(*) FROM year_data WHERE tavan_sira IS NOT NULL)),
    jsonb_build_object('group','year','field','kayit_yaptiran','label','Kayıt yaptıran','filled',(SELECT COUNT(*) FROM year_data WHERE kayit_yaptiran IS NOT NULL)),
    jsonb_build_object('group','year','field','bos_kalan','label','Boş kalan','filled',(SELECT COUNT(*) FROM year_data WHERE bos_kalan IS NOT NULL)),
    jsonb_build_object('group','staff','field','any_positive_staff','label','Akademik kadro pozitif','filled',(SELECT COUNT(*) FROM program WHERE COALESCE(prof_sayisi,0)+COALESCE(doc_sayisi,0)+COALESCE(dou_sayisi,0)+COALESCE(ogr_gor_sayisi,0)+COALESCE(ar_gor_sayisi,0) > 0)),
    jsonb_build_object('group','raw','field','tyc_valid','label','TYÇ anlamlı','filled',(SELECT COUNT(*) FROM program WHERE NULLIF(yokatlas_raw->>'tyc','') IS NOT NULL AND yokatlas_raw->>'tyc' <> '*'))
  ),
  'anomalies', jsonb_build_object(
    'stateProgramsWithPaidFallbackRisk', (SELECT COUNT(*) FROM program WHERE universite_turu = 'DEVLET' AND ucret IS NULL AND NULLIF(burs_orani_adi,'') IS NULL AND burs_orani = 0),
    'tycStar', (SELECT COUNT(*) FROM program WHERE yokatlas_raw->>'tyc' = '*'),
    'allZeroStaff', (SELECT COUNT(*) FROM program WHERE COALESCE(prof_sayisi,0)=0 AND COALESCE(doc_sayisi,0)=0 AND COALESCE(dou_sayisi,0)=0 AND COALESCE(ogr_gor_sayisi,0)=0 AND COALESCE(ar_gor_sayisi,0)=0),
    'missingBaseRankOrScore', (SELECT COUNT(*) FROM year_data WHERE taban_puan IS NULL OR taban_sira IS NULL),
    'placedGreaterThanQuota', (SELECT COUNT(*) FROM year_data WHERE yil_kontenjan IS NOT NULL AND yerlesen IS NOT NULL AND yerlesen > yil_kontenjan)
  )
)::text;
`);

const missingSamples = runSql(`
SELECT jsonb_agg(row_to_json(t))
FROM (
  SELECT p.id, p.program_adi, u.ad AS universite, yd.taban_puan, yd.taban_sira, yd.yerlesen, yd.yil_kontenjan
  FROM lisans_programlari p
  JOIN universitetler u ON u.id = p.universite_id
  LEFT JOIN lisans_yil_verileri yd ON yd.program_id = p.id AND yd.yil = ${YEAR}
  WHERE yd.taban_puan IS NULL OR yd.taban_sira IS NULL
  ORDER BY u.ad, p.program_adi
  LIMIT 15
) t;
`);

function pct(filled, total) {
  if (!total) return "0.00%";
  return `${((filled / total) * 100).toFixed(2)}%`;
}

function policy(field, total) {
  if (field.filled === total) return "Ana alan";
  if (field.filled === 0) return "Kullanma";
  return "Koşullu göster";
}

const lines = [
  "# Veri Kalite Raporu",
  "",
  `Uretim zamani: ${new Date().toISOString()}`,
  `Ana veri yili: ${summary.year}`,
  "",
  "## Ozet",
  "",
  `- Universite sayisi: ${summary.universities}`,
  `- Lisans programi sayisi: ${summary.programs}`,
  `- ${summary.year} yil verisi satiri: ${summary.yearRows}`,
  "",
  "## Alan Doluluklari",
  "",
  "| Grup | Alan | Dolu | Oran | Karar |",
  "|---|---|---:|---:|---|",
  ...summary.fields.map((field) => {
    const total = field.group === "year" ? summary.yearRows : summary.programs;
    return `| ${field.group} | ${field.label} | ${field.filled}/${total} | ${pct(field.filled, total)} | ${policy(field, total)} |`;
  }),
  "",
  "## Anomali Kontrolleri",
  "",
  `- Devlet programlarinda ucretli fallback riski: ${summary.anomalies.stateProgramsWithPaidFallbackRisk}`,
  `- TYC degeri '*' olan kayit: ${summary.anomalies.tycStar}`,
  `- Akademik kadrosu tamamen 0 olan program: ${summary.anomalies.allZeroStaff}`,
  `- ${summary.year} taban puan veya taban sira eksik program: ${summary.anomalies.missingBaseRankOrScore}`,
  `- ${summary.year} yerlesen sayisi kontenjandan buyuk kayit: ${summary.anomalies.placedGreaterThanQuota}`,
  "",
  "## Gosterim Kurallari",
  "",
  "- Kullaniciya '-' veya 'Eksik' gosterilmez.",
  "- Alan degeri yoksa kart render edilmez; panel bossa panel render edilmez.",
  "- Tablo kolonu kapsami dusukse kolon ana tabloda kullanilmaz.",
  "- Devlet universitesinde ucret/burs bilgisi yoksa 'Ucretli' fallback'i kullanilmaz.",
  "- TYC '*' degeri veri yok kabul edilir.",
  "- Akademik kadro toplami 0 ise akademik kadro paneli gosterilmez.",
  "",
  "## Eksik Taban Puan/Sira Ornekleri",
  "",
  "| Program ID | Universite | Program | Yerlesen | Kontenjan |",
  "|---:|---|---|---:|---:|",
  ...((missingSamples ?? []).map((row) => `| ${row.id} | ${row.universite} | ${row.program_adi} | ${row.yerlesen ?? ""} | ${row.yil_kontenjan ?? ""} |`)),
  "",
];

await mkdir(dirname(REPORT_PATH), { recursive: true });
await writeFile(REPORT_PATH, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${REPORT_PATH}`);
