ALTER TABLE city_cost_items DROP CONSTRAINT city_cost_items_category_check;

ALTER TABLE city_cost_items
    ADD CONSTRAINT city_cost_items_category_check
        CHECK (category IN (
            'housing',
            'transport',
            'electricity',
            'natural_gas',
            'food',
            'general_index',
            'student_budget',
            'source_note'
        ));

INSERT INTO city_cost_profiles (city, period_label, currency, source_summary, source_date, confidence, notes)
SELECT DISTINCT
    btrim(u.sehir),
    '2026 resmi kaynak genişletmesi',
    'TRY',
    'Elektrik satırları EPDK ulusal mesken tarifesinden, doğalgaz limitleri BOTAŞ il bazlı kademeli tüketim limitlerinden gelir.',
    '2026-05-16'::date,
    'OFFICIAL_SOURCE',
    'Elektrik örneği ulusal mesken tarifesine göre 150 kWh için hesaplanmış tahmindir. Doğalgaz satırı maliyet değil, Mayıs 2026 için Kademe-1 aylık tüketim limitidir.'
FROM universitetler u
WHERE u.sehir IS NOT NULL
  AND btrim(u.sehir) <> ''
  AND upper(btrim(u.sehir)) NOT IN ('KIBRIS', 'BILINMIYOR', 'BİLİNMİYOR')
  AND NOT EXISTS (
      SELECT 1
      FROM city_cost_profiles p
      WHERE lower(p.city) = lower(btrim(u.sehir))
  );

UPDATE city_cost_profiles p
SET source_summary = 'Elektrik satırları EPDK ulusal mesken tarifesinden, doğalgaz limitleri BOTAŞ il bazlı kademeli tüketim limitlerinden gelir.',
    source_date = '2026-05-16'::date,
    confidence = 'OFFICIAL_SOURCE',
    notes = 'Elektrik örneği ulusal mesken tarifesine göre 150 kWh için hesaplanmış tahmindir. Doğalgaz satırı maliyet değil, Mayıs 2026 için Kademe-1 aylık tüketim limitidir.',
    updated_at = NOW()
WHERE EXISTS (
    SELECT 1
    FROM universitetler u
    WHERE lower(btrim(u.sehir)) = lower(p.city)
);

INSERT INTO city_cost_items (
    profile_id,
    category,
    label,
    amount,
    unit,
    value_text,
    period_label,
    source,
    source_url,
    source_date,
    confidence,
    sort_order
)
SELECT
    p.id,
    'electricity',
    'Mesken elektrik kademe-1 birim fiyatı',
    2.92,
    'TL/kWh',
    NULL,
    '2026-Q2',
    'EPDK',
    'https://epdk.gov.tr/Detay/Icerik/3-0-0-1/elektrik-piyasasi-tarifeleri',
    '2026-04-04'::date,
    'OFFICIAL_SOURCE',
    100
FROM city_cost_profiles p
WHERE EXISTS (
    SELECT 1
    FROM universitetler u
    WHERE lower(btrim(u.sehir)) = lower(p.city)
)
AND NOT EXISTS (
    SELECT 1
    FROM city_cost_items i
    WHERE i.profile_id = p.id
      AND i.category = 'electricity'
      AND i.label = 'Mesken elektrik kademe-1 birim fiyatı'
);

INSERT INTO city_cost_items (
    profile_id,
    category,
    label,
    amount,
    unit,
    value_text,
    period_label,
    source,
    source_url,
    source_date,
    confidence,
    sort_order
)
SELECT
    p.id,
    'electricity',
    '150 kWh örnek elektrik gideri',
    438.00,
    'TL/ay',
    NULL,
    '2026-Q2',
    'EPDK',
    'https://epdk.gov.tr/Detay/Icerik/3-0-0-1/elektrik-piyasasi-tarifeleri',
    '2026-04-04'::date,
    'OFFICIAL_SOURCE',
    101
FROM city_cost_profiles p
WHERE EXISTS (
    SELECT 1
    FROM universitetler u
    WHERE lower(btrim(u.sehir)) = lower(p.city)
)
AND NOT EXISTS (
    SELECT 1
    FROM city_cost_items i
    WHERE i.profile_id = p.id
      AND i.category = 'electricity'
      AND i.label = '150 kWh örnek elektrik gideri'
);

WITH natural_gas_seed(city, may_limit) AS (
    VALUES
        ('ADANA', 36.58), ('ADIYAMAN', 100.59), ('AFYONKARAHİSAR', 116.32),
        ('AĞRI', 129.19), ('AKSARAY', 92.14), ('AMASYA', 104.88),
        ('ANKARA', 109.01), ('ANTALYA', 55.37), ('ARDAHAN', 175.07),
        ('ARTVİN', 127.37), ('AYDIN', 66.24), ('BALIKESİR', 90.70),
        ('BARTIN', 144.22), ('BATMAN', 60.53), ('BAYBURT', 128.47),
        ('BİLECİK', 124.48), ('BİNGÖL', 94.50), ('BİTLİS', 161.86),
        ('BOLU', 133.49), ('BURDUR', 109.67), ('BURSA', 92.75),
        ('ÇANAKKALE', 93.52), ('ÇANKIRI', 125.14), ('ÇORUM', 115.64),
        ('DENİZLİ', 93.94), ('DİYARBAKIR', 61.25), ('DÜZCE', 139.16),
        ('EDİRNE', 100.43), ('ELAZIĞ', 73.66), ('ERZİNCAN', 106.16),
        ('ERZURUM', 154.02), ('ESKİŞEHİR', 113.02), ('GAZİANTEP', 63.40),
        ('GİRESUN', 134.80), ('GÜMÜŞHANE', 132.07), ('HAKKARİ', 192.99),
        ('HATAY', 34.55), ('IĞDIR', 73.80), ('ISPARTA', 128.59),
        ('İSTANBUL', 119.96), ('İZMİR', 66.10), ('KAHRAMANMARAŞ', 66.38),
        ('KARABÜK', 133.30), ('KARAMAN', 101.17), ('KARS', 154.60),
        ('KASTAMONU', 147.39), ('KAYSERİ', 107.05), ('KIRIKKALE', 96.62),
        ('KIRKLARELİ', 101.62), ('KIRŞEHİR', 94.45), ('KİLİS', 55.14),
        ('KOCAELİ', 127.26), ('KONYA', 124.71), ('KÜTAHYA', 111.95),
        ('MALATYA', 81.90), ('MANİSA', 72.12), ('MARDİN', 68.32),
        ('MERSİN', 32.94), ('MUĞLA', 129.17), ('MUŞ', 134.96),
        ('NEVŞEHİR', 118.95), ('NİĞDE', 128.01), ('ORDU', 124.97),
        ('OSMANİYE', 38.55), ('RİZE', 127.12), ('SAKARYA', 133.16),
        ('SAMSUN', 162.70), ('SİİRT', 68.58), ('SİNOP', 141.30),
        ('SİVAS', 109.73), ('ŞANLIURFA', 45.17), ('ŞIRNAK', 105.53),
        ('TEKİRDAĞ', 108.89), ('TOKAT', 96.22), ('TRABZON', 140.72),
        ('TUNCELİ', 89.76), ('UŞAK', 106.21), ('VAN', 134.16),
        ('YALOVA', 111.14), ('YOZGAT', 128.57), ('ZONGULDAK', 145.65)
)
INSERT INTO city_cost_items (
    profile_id,
    category,
    label,
    amount,
    unit,
    value_text,
    period_label,
    source,
    source_url,
    source_date,
    confidence,
    sort_order
)
SELECT
    p.id,
    'natural_gas',
    'Kademe-1 doğalgaz tüketim limiti',
    s.may_limit,
    'Sm3/ay',
    NULL,
    'Mayıs 2026',
    'BOTAŞ',
    'https://www.botas.gov.tr/uploads/dosyaYoneticisi/325499-kfu_limitler.pdf',
    '2026-04-04'::date,
    'OFFICIAL_SOURCE',
    110
FROM natural_gas_seed s
JOIN city_cost_profiles p ON upper(p.city) = s.city
WHERE EXISTS (
    SELECT 1
    FROM universitetler u
    WHERE upper(btrim(u.sehir)) = s.city
)
AND NOT EXISTS (
    SELECT 1
    FROM city_cost_items i
    WHERE i.profile_id = p.id
      AND i.category = 'natural_gas'
      AND i.label = 'Kademe-1 doğalgaz tüketim limiti'
);
