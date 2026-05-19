"""
YÖKAtlas verilerini PostgreSQL'e aktarır.

Birincil kaynak : lisans-data.json  (program meta + 2025 puan/sıra)
Yardımcı kaynak : yokatlas_sonuclar.xlsx  (2022-2024 geçmiş yıl verileri)

Kurulum:
    pip install pandas openpyxl psycopg2-binary

Kullanım:
    python database/seed_yokatlas.py \
        --json  lisans-data.json \
        --excel yokatlas_sonuclar.xlsx \
        --dsn   "postgresql://postgres:postgres@localhost:5432/universiteatlasi"
"""

import argparse
import re
import json
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

# ── Sabitler ──────────────────────────────────────────────────────────────────

BURS_PATTERN = re.compile(
    r"\((Burslu|%\d+ [İi]ndirimli|[Üü]cretli)\)", re.IGNORECASE
)
DIL_PATTERN = re.compile(
    r"\((İngilizce|Fransızca|Almanca|Arapça|Japonca|Rusça|Çince)\)", re.IGNORECASE
)

BURS_TO_ORAN = {
    "burslu":         100,
    "%50 indirimli":   50,
    "%25 indirimli":   25,
    "ücretli":          0,
}

SCORE_TYPE_MAP = {"SAY": "SAY", "EA": "EA", "SÖZ": "SOZ", "SOZ": "SOZ",
                  "DİL": "DIL", "DIL": "DIL", "TYT": "TYT"}

# ── Yardımcı fonksiyonlar ─────────────────────────────────────────────────────

def extract_burs(name: str) -> tuple[str, int, float | None]:
    """Program adından burs tipini ayıklar. (temiz_ad, burs_orani, ucret)"""
    m = BURS_PATTERN.search(name)
    if not m:
        return name.strip(), 100, None   # devlet → ücretsiz
    burs_str = m.group(1).strip()
    oran = BURS_TO_ORAN.get(burs_str.lower(), 0)
    clean = BURS_PATTERN.sub("", name).strip().rstrip("()")
    return clean.strip(), oran, None


def extract_dil(name: str) -> tuple[str, str]:
    """Program adından dili ayıklar. (temiz_ad, dil)"""
    m = DIL_PATTERN.search(name)
    if not m:
        return name.strip(), "Türkçe"
    dil = m.group(1).strip()
    clean = DIL_PATTERN.sub("", name).strip().rstrip("()")
    return clean.strip(), dil


def parse_int(val) -> int | None:
    if val is None:
        return None
    s = str(val).strip().replace(".", "").replace(",", "")
    return int(s) if s.isdigit() else None


def parse_float(val) -> float | None:
    if val is None:
        return None
    s = str(val).strip()
    if not s or s.lower() in ("dolmadı", "dolmadi", "-"):
        return None
    try:
        return float(s.replace(",", ".").replace(".", "", s.replace(",", ".").count(".") - 1))
    except ValueError:
        return None


def detect_uni_type(programs: list) -> str:
    """Programların burs durumuna göre üniversite türünü belirler."""
    names = [p.get("name", "") for p in programs]
    has_burs_info = any(BURS_PATTERN.search(n) for n in names)
    if not has_burs_info:
        return "DEVLET"
    has_ucretli = any("cretli" in n.lower() for n in names)
    return "VAKIF_UCRETLI" if has_ucretli else "VAKIF"


# ── JSON yükle ────────────────────────────────────────────────────────────────

def load_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ── Excel yükle (2022-2024 geçmiş yıl) ───────────────────────────────────────

class ExcelIndex:
    """Excel satırlarını hem 4-key (tam) hem 3-key (burs hariç) ile indexler."""

    def __init__(self):
        self.exact:    dict[tuple, dict[int, dict]] = {}   # (uni, prog, dil, burs) → yillar
        self.fallback: dict[tuple, dict[int, dict]] = {}   # (uni, prog, dil)        → yillar

    def __len__(self):
        return len(self.exact)

    def add(self, uni, prog, dil, burs, years_data):
        k4 = _normalize_key(uni, prog, dil, burs)
        k3 = k4[:3]
        self.exact[k4] = years_data
        if k3 not in self.fallback:
            self.fallback[k3] = years_data

    def get(self, uni_n, prog_n, dil_n, burs_n) -> dict[int, dict]:
        k4 = (uni_n, prog_n, dil_n, burs_n)
        k3 = (uni_n, prog_n, dil_n)
        return self.exact.get(k4) or self.fallback.get(k3) or {}


def load_excel(path: str) -> "ExcelIndex":
    """Excel'i okur. 4-key tam eşleşme, bulunamazsa 3-key (burs hariç) fallback."""
    # keep_default_na=False: boş hücreleri 'nan' string'ine değil None'a çevirir
    df = pd.read_excel(path, sheet_name=0, dtype=str, keep_default_na=False, na_values=[""])
    df = df.where(pd.notna(df), None)

    index = ExcelIndex()

    for _, row in df.iterrows():
        uni  = (row.iloc[0] or "").strip()
        prog = (row.iloc[2] or "").strip()
        dil  = (row.iloc[3] or "").strip()
        burs = row.iloc[4]

        years_data = {}
        for i, year in enumerate(range(2025, 2021, -1)):   # 2025→2022
            rank  = _parse_excel_int(row.iloc[6 + i])
            score = _parse_excel_float(row.iloc[10 + i])
            if rank is not None or score is not None:
                years_data[year] = {"taban_sira": rank, "taban_puan": score}

        index.add(uni, prog, dil, burs, years_data)

    return index


def _burs_normalize(s: str) -> str:
    """Burs stringini karşılaştırma için normalize eder.
    'İ' (U+0130) ve 'i' + combining-dot (U+0307) → düz 'i' dönüşümü yapılır.
    """
    return s.strip().lower().replace("İ", "i").replace("i̇", "i")


def _normalize_key(uni: str, prog: str, dil: str, burs) -> tuple:
    uni_n  = re.sub(r"\s+", " ", uni.upper().strip())
    prog_n = re.sub(r"\s+", " ", prog.upper().strip())
    dil_n  = (dil or "TÜRKÇE").upper().strip()
    burs_n = "" if (burs is None or pd.isna(burs) or str(burs).strip() == "") \
             else _burs_normalize(str(burs))
    return (uni_n, prog_n, dil_n, burs_n)


def _parse_excel_int(val) -> int | None:
    if val is None:
        return None
    s = str(val).strip().lower()
    if s in ("dolmadı", "dolmadi", "-", ""):
        return None
    try:
        return int(s.replace(".", "").replace(",", ""))
    except ValueError:
        return None


def _parse_excel_float(val) -> float | None:
    if val is None:
        return None
    s = str(val).strip().lower()
    if s in ("dolmadı", "dolmadi", "-", ""):
        return None
    try:
        return float(s.replace(",", "."))
    except ValueError:
        return None


# ── DB işlemleri ──────────────────────────────────────────────────────────────

def seed(json_data: dict, excel_data: dict, conn):
    cur = conn.cursor()
    universities = json_data["universities"]

    # ── 0. Mevcut veriyi temizle (V2 örnek data + yarım kalan önceki seed) ────
    cur.execute("""
        TRUNCATE TABLE
            lisans_yil_verileri,
            tercih_ogeleri,
            lisans_programlari,
            tercih_listeleri,
            universitetler
        RESTART IDENTITY CASCADE
    """)
    conn.commit()
    print("  Tablolar temizlendi.")

    # ── 1. Üniversiteler ──────────────────────────────────────────────────────
    uni_rows = [
        (u["name"], u.get("slug"), detect_uni_type(u.get("programs", [])))
        for u in universities
    ]
    execute_values(
        cur,
        """
        INSERT INTO universitetler (ad, slug, tur)
        VALUES %s
        ON CONFLICT (ad) DO UPDATE SET slug = EXCLUDED.slug, tur = EXCLUDED.tur
        """,
        uni_rows,
    )
    conn.commit()

    cur.execute("SELECT id, ad FROM universitetler")
    uni_map = {ad: uid for uid, ad in cur.fetchall()}

    # ── 2. Lisans Programları + 2025 yıl verisi ───────────────────────────────
    prog_rows  = []
    stat_rows  = []   # (prog_idx, year, taban_puan, taban_sira)
    excel_keys = []   # Excel eşleştirme anahtarları
    seen_kodu  = set()  # JSON'daki duplicate program_kodu'ları atla

    for u in universities:
        uni_id = uni_map[u["name"]]
        for p in u.get("programs", []):
            kod = p.get("code")
            if kod and kod in seen_kodu:
                continue
            if kod:
                seen_kodu.add(kod)

            raw_name = p["name"]

            # Dil ve burs ayıkla
            name_no_burs, burs_orani, ucret = extract_burs(raw_name)
            clean_name, dil = extract_dil(name_no_burs)

            puan_turu  = SCORE_TYPE_MAP.get((p.get("scoreType") or "").upper())
            kontenjan  = parse_int(p.get("quota", {}).get("totalQuota"))
            detail_url = p.get("detailUrl")

            prog_rows.append((
                uni_id, p["faculty"], clean_name, puan_turu,
                kontenjan, burs_orani, ucret, dil, detail_url, kod,
            ))

            # 2025 scoreStats
            ss = p.get("scoreStats", {})
            score_2025 = _parse_excel_float(ss.get("generalBaseScore"))
            rank_2025  = parse_int(
                str(ss.get("generalRank", "")).replace(".", "").replace(",", "") or None
            )
            stat_rows.append((len(prog_rows) - 1, 2025, score_2025, rank_2025))

            # Excel eşleştirme anahtarı
            uni_n  = re.sub(r"\s+", " ", u["name"].upper().strip())
            prog_n = re.sub(r"\s+", " ", clean_name.upper().strip())
            burs_n = "" if burs_orani == 100 and not BURS_PATTERN.search(raw_name) \
                       else _burs_to_excel_str(burs_orani)
            excel_keys.append((uni_n, prog_n, dil.upper().strip(), burs_n))

    rows = execute_values(
        cur,
        """
        INSERT INTO lisans_programlari
            (universite_id, fakulte, program_adi, puan_turu,
             kontenjan, burs_orani, ucret, dil, detail_url, program_kodu)
        VALUES %s
        RETURNING id
        """,
        prog_rows,
        fetch=True,   # tüm batch'lerin RETURNING sonuçlarını toplar
    )
    program_ids = [r[0] for r in rows]
    conn.commit()

    # ── 3. Yıllık veriler ─────────────────────────────────────────────────────
    yearly_inserts = []

    for idx, (prog_id, year, score, rank) in enumerate(stat_rows):
        real_id = program_ids[prog_id]
        yearly_inserts.append((real_id, year, score, rank, None, None, None, None))

    # Excel'den 2022-2024 (tam eşleşme yoksa burs hariç fallback)
    matched = 0
    for prog_idx, ekey in enumerate(excel_keys):
        excel_years = excel_data.get(*ekey)
        real_id = program_ids[prog_idx]
        for year in (2022, 2023, 2024):
            d = excel_years.get(year, {})
            if d:
                matched += 1
            yearly_inserts.append((
                real_id, year,
                d.get("taban_puan"), d.get("taban_sira"),
                None, None, None, None,
            ))

    execute_values(
        cur,
        """
        INSERT INTO lisans_yil_verileri
            (program_id, yil, taban_puan, taban_sira,
             tavan_puan, tavan_sira, yerlesen, bos_kalan)
        VALUES %s
        ON CONFLICT (program_id, yil) DO NOTHING
        """,
        yearly_inserts,
    )
    conn.commit()
    cur.close()

    print(f"✓ {len(uni_rows)} üniversite")
    print(f"✓ {len(prog_rows)} program (puan türü, kontenjan dahil)")
    print(f"✓ {len(yearly_inserts)} yıllık kayıt ({matched} Excel eşleşmesi)")


def _burs_to_excel_str(oran: int) -> str:
    return {100: "burslu", 50: "%50 indirimli", 25: "%25 indirimli", 0: "ücretli"}.get(oran, "")
    # Değerler _burs_normalize() çıktısıyla birebir uyumlu tutulmuştur.


# ── Ana akış ──────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--json",  required=True, help="lisans-data.json yolu")
    parser.add_argument("--excel", required=True, help="yokatlas_sonuclar.xlsx yolu")
    parser.add_argument(
        "--dsn",
        default="postgresql://postgres:postgres@localhost:5432/universiteatlasi",
    )
    args = parser.parse_args()

    print(f"JSON okunuyor: {args.json}")
    json_data = load_json(args.json)
    print(f"  → {json_data['programCount']} program, {json_data['universityCount']} üniversite")

    print(f"Excel okunuyor: {args.excel}")
    excel_data = load_excel(args.excel)
    print(f"  → {len(excel_data)} program anahtarı")

    print("Veritabanına bağlanılıyor...")
    conn = psycopg2.connect(args.dsn)

    print("Veri aktarılıyor...")
    seed(json_data, excel_data, conn)
    conn.close()
    print("Tamamlandı.")


if __name__ == "__main__":
    main()
