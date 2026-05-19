CREATE TABLE city_cost_profiles (
    id              BIGSERIAL PRIMARY KEY,
    city            VARCHAR(100) NOT NULL UNIQUE,
    period_label    VARCHAR(80) NOT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'TRY',
    source_summary  VARCHAR(255) NOT NULL,
    source_date     DATE NOT NULL,
    confidence      VARCHAR(30) NOT NULL DEFAULT 'OFFICIAL_SOURCE',
    notes           TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE city_cost_items (
    id              BIGSERIAL PRIMARY KEY,
    profile_id      BIGINT NOT NULL REFERENCES city_cost_profiles(id) ON DELETE CASCADE,
    category        VARCHAR(40) NOT NULL,
    label           VARCHAR(160) NOT NULL,
    amount          NUMERIC(12,2),
    unit            VARCHAR(60),
    value_text      VARCHAR(255),
    period_label    VARCHAR(80) NOT NULL,
    source          VARCHAR(120) NOT NULL,
    source_url      TEXT NOT NULL,
    source_date     DATE NOT NULL,
    confidence      VARCHAR(30) NOT NULL DEFAULT 'OFFICIAL_SOURCE',
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT city_cost_items_category_check
        CHECK (category IN ('housing', 'transport', 'food', 'general_index', 'student_budget', 'source_note')),
    CONSTRAINT city_cost_items_value_check
        CHECK (amount IS NOT NULL OR value_text IS NOT NULL)
);

CREATE INDEX idx_city_cost_items_profile ON city_cost_items(profile_id);
CREATE INDEX idx_city_cost_items_category ON city_cost_items(category);

INSERT INTO city_cost_profiles (city, period_label, currency, source_summary, source_date, confidence, notes)
VALUES
    ('Ankara', '2026 resmi kaynak pilotu', 'TRY', 'TÜİK, TCMB EVDS ve EGO resmi tarife kaynakları', '2026-05-16', 'OFFICIAL_SOURCE', 'Tutarlar resmi kaynaklardan derlenen ilk pilot kayıtlardır; TÜFE kişisel yaşam maliyeti olarak yorumlanmamalıdır.'),
    ('İstanbul', '2026 resmi kaynak pilotu', 'TRY', 'TÜİK, TCMB EVDS ve İBB/İETT resmi tarife kaynakları', '2026-05-16', 'OFFICIAL_SOURCE', 'Tutarlar resmi kaynaklardan derlenen ilk pilot kayıtlardır; TÜFE kişisel yaşam maliyeti olarak yorumlanmamalıdır.'),
    ('İzmir', '2026 resmi kaynak pilotu', 'TRY', 'TÜİK, TCMB EVDS ve İzmirim Kart resmi tarife kaynakları', '2026-05-16', 'OFFICIAL_SOURCE', 'Tutarlar resmi kaynaklardan derlenen ilk pilot kayıtlardır; TÜFE kişisel yaşam maliyeti olarak yorumlanmamalıdır.'),
    ('Antalya', '2026 resmi kaynak pilotu', 'TRY', 'TÜİK, TCMB EVDS ve Antalya Büyükşehir UKOME resmi tarife kaynakları', '2026-05-16', 'OFFICIAL_SOURCE', 'Tutarlar resmi kaynaklardan derlenen ilk pilot kayıtlardır; TÜFE kişisel yaşam maliyeti olarak yorumlanmamalıdır.'),
    ('Bursa', '2026 resmi kaynak pilotu', 'TRY', 'TÜİK, TCMB EVDS ve BURULAŞ resmi tarife kaynakları', '2026-05-16', 'OFFICIAL_SOURCE', 'Tutarlar resmi kaynaklardan derlenen ilk pilot kayıtlardır; TÜFE kişisel yaşam maliyeti olarak yorumlanmamalıdır.'),
    ('Konya', '2026 resmi kaynak pilotu', 'TRY', 'TÜİK, TCMB EVDS ve ATUS/Konya Büyükşehir resmi tarife kaynakları', '2026-05-16', 'OFFICIAL_SOURCE', 'Tutarlar resmi kaynaklardan derlenen ilk pilot kayıtlardır; TÜFE kişisel yaşam maliyeti olarak yorumlanmamalıdır.')
ON CONFLICT (city) DO UPDATE SET
    period_label = EXCLUDED.period_label,
    currency = EXCLUDED.currency,
    source_summary = EXCLUDED.source_summary,
    source_date = EXCLUDED.source_date,
    confidence = EXCLUDED.confidence,
    notes = EXCLUDED.notes,
    updated_at = NOW();

WITH profiles AS (
    SELECT id, city FROM city_cost_profiles
    WHERE city IN ('Ankara', 'İstanbul', 'İzmir', 'Antalya', 'Bursa', 'Konya')
),
seed(city, category, label, amount, unit, value_text, period_label, source, source_url, source_date, confidence, sort_order) AS (
    VALUES
    ('Ankara', 'transport', 'Öğrenci aylık abonman', 450.00, 'TL/ay', NULL, '01.01.2026 itibarıyla', 'EGO Genel Müdürlüğü', 'https://www.ego.gov.tr/tr/sayfa/2098/tasima-ucretleri?v=1.0.24', '2026-01-01', 'OFFICIAL_SOURCE', 10),
    ('Ankara', 'transport', 'Sabah tam biniş indirimi', 25.00, 'TL/biniş', NULL, '06.00-07.00 arası', 'EGO Genel Müdürlüğü', 'https://www.ego.gov.tr/tr/sayfa/2098/tasima-ucretleri?v=1.0.24', '2026-01-01', 'OFFICIAL_SOURCE', 20),
    ('Ankara', 'housing', 'Konut ve kira göstergesi', NULL, NULL, 'TCMB Konut Fiyat Endeksi ve Yeni Kiracı Kira Endeksi EVDS üzerinden izlenir.', 'Aylık/çeyreklik seri', 'TCMB EVDS', 'https://www.tcmb.gov.tr/wps/wcm/connect/EN/TCMB%2BEN/Main%2BMenu/Statistics/Real%2BSector%2BStatistics/Residential%2BProperty%2BPrice%2BIndex/', '2026-03-31', 'OFFICIAL_SOURCE', 30),
    ('Ankara', 'general_index', 'Genel fiyat bağlamı', NULL, NULL, 'TÜİK TÜFE ülke geneli ve bölgesel fiyat değişimlerini izler; kişisel yaşam maliyeti değildir.', '2026 metodoloji', 'TÜİK Veri Portalı', 'https://veriportali.tuik.gov.tr/en/', '2026-05-16', 'OFFICIAL_SOURCE', 40),

    ('İstanbul', 'transport', 'Öğrenci aylık abonman', 593.00, 'TL/ay', NULL, '16.02.2026 itibarıyla', 'İBB / İETT', 'https://iett.istanbul/icerik/IETT-Toplu-Ulasim-ucret-Tarifesi', '2026-02-16', 'OFFICIAL_SOURCE', 10),
    ('İstanbul', 'transport', 'Öğrenci elektronik bilet', 20.50, 'TL/biniş', NULL, '16.02.2026 itibarıyla', 'İBB / İETT', 'https://iett.istanbul/icerik/IETT-Toplu-Ulasim-ucret-Tarifesi', '2026-02-16', 'OFFICIAL_SOURCE', 20),
    ('İstanbul', 'housing', 'Konut ve kira göstergesi', NULL, NULL, 'TCMB Konut Fiyat Endeksi ve Yeni Kiracı Kira Endeksi EVDS üzerinden izlenir.', 'Aylık/çeyreklik seri', 'TCMB EVDS', 'https://www.tcmb.gov.tr/wps/wcm/connect/EN/TCMB%2BEN/Main%2BMenu/Statistics/Real%2BSector%2BStatistics/Residential%2BProperty%2BPrice%2BIndex/', '2026-03-31', 'OFFICIAL_SOURCE', 30),
    ('İstanbul', 'general_index', 'Genel fiyat bağlamı', NULL, NULL, 'TÜİK TÜFE ülke geneli ve bölgesel fiyat değişimlerini izler; kişisel yaşam maliyeti değildir.', '2026 metodoloji', 'TÜİK Veri Portalı', 'https://veriportali.tuik.gov.tr/en/', '2026-05-16', 'OFFICIAL_SOURCE', 40),

    ('İzmir', 'transport', 'Genç merkezi biniş', 17.50, 'TL/biniş', NULL, '01.04.2026 itibarıyla', 'İzmirim Kart', 'https://www.izmirimkart.com.tr/tarife-ve-ucretlendirme', '2026-04-01', 'OFFICIAL_SOURCE', 10),
    ('İzmir', 'transport', 'Halk Taşıt genç biniş', 8.75, 'TL/biniş', NULL, 'Belirlenen saatlerde', 'İzmirim Kart', 'https://www.izmirimkart.com.tr/tarife-ve-ucretlendirme', '2026-04-01', 'OFFICIAL_SOURCE', 20),
    ('İzmir', 'housing', 'Konut ve kira göstergesi', NULL, NULL, 'TCMB Konut Fiyat Endeksi ve Yeni Kiracı Kira Endeksi EVDS üzerinden izlenir.', 'Aylık/çeyreklik seri', 'TCMB EVDS', 'https://www.tcmb.gov.tr/wps/wcm/connect/EN/TCMB%2BEN/Main%2BMenu/Statistics/Real%2BSector%2BStatistics/Residential%2BProperty%2BPrice%2BIndex/', '2026-03-31', 'OFFICIAL_SOURCE', 30),
    ('İzmir', 'general_index', 'Genel fiyat bağlamı', NULL, NULL, 'TÜİK TÜFE ülke geneli ve bölgesel fiyat değişimlerini izler; kişisel yaşam maliyeti değildir.', '2026 metodoloji', 'TÜİK Veri Portalı', 'https://veriportali.tuik.gov.tr/en/', '2026-05-16', 'OFFICIAL_SOURCE', 40),

    ('Antalya', 'transport', 'Öğrenci biniş', 20.00, 'TL/biniş', NULL, '23.03.2026 itibarıyla', 'Antalya Büyükşehir Belediyesi UKOME', 'https://www.antalya.bel.tr/Content/UserFiles/Files/Birimler_Basvuru_Rehberi/Guncel_Toplu_Tasima_Ucret_Tarifesi_Ukome_Genel_Kurulu_Karari1.pdf', '2026-03-23', 'OFFICIAL_SOURCE', 10),
    ('Antalya', 'transport', 'Tam biniş', 42.00, 'TL/biniş', NULL, '23.03.2026 itibarıyla', 'Antalya Büyükşehir Belediyesi UKOME', 'https://www.antalya.bel.tr/Content/UserFiles/Files/Birimler_Basvuru_Rehberi/Guncel_Toplu_Tasima_Ucret_Tarifesi_Ukome_Genel_Kurulu_Karari1.pdf', '2026-03-23', 'OFFICIAL_SOURCE', 20),
    ('Antalya', 'housing', 'Konut ve kira göstergesi', NULL, NULL, 'TCMB Konut Fiyat Endeksi ve Yeni Kiracı Kira Endeksi EVDS üzerinden izlenir.', 'Aylık/çeyreklik seri', 'TCMB EVDS', 'https://www.tcmb.gov.tr/wps/wcm/connect/EN/TCMB%2BEN/Main%2BMenu/Statistics/Real%2BSector%2BStatistics/Residential%2BProperty%2BPrice%2BIndex/', '2026-03-31', 'OFFICIAL_SOURCE', 30),
    ('Antalya', 'general_index', 'Genel fiyat bağlamı', NULL, NULL, 'TÜİK TÜFE ülke geneli ve bölgesel fiyat değişimlerini izler; kişisel yaşam maliyeti değildir.', '2026 metodoloji', 'TÜİK Veri Portalı', 'https://veriportali.tuik.gov.tr/en/', '2026-05-16', 'OFFICIAL_SOURCE', 40),

    ('Bursa', 'transport', 'Öğrenci abonman', 910.00, 'TL/100 biniş', NULL, '03.02.2026 itibarıyla', 'BURULAŞ', 'https://www.burulas.com.tr/bilgi-merkezi/fiyat-tarifeleri', '2026-02-03', 'OFFICIAL_SOURCE', 10),
    ('Bursa', 'transport', 'BursaRay öğrenci biniş', 10.00, 'TL/biniş', NULL, '03.02.2026 itibarıyla', 'BURULAŞ', 'https://www.burulas.com.tr/bilgi-merkezi/fiyat-tarifeleri', '2026-02-03', 'OFFICIAL_SOURCE', 20),
    ('Bursa', 'housing', 'Konut ve kira göstergesi', NULL, NULL, 'TCMB Konut Fiyat Endeksi ve Yeni Kiracı Kira Endeksi EVDS üzerinden izlenir.', 'Aylık/çeyreklik seri', 'TCMB EVDS', 'https://www.tcmb.gov.tr/wps/wcm/connect/EN/TCMB%2BEN/Main%2BMenu/Statistics/Real%2BSector%2BStatistics/Residential%2BProperty%2BPrice%2BIndex/', '2026-03-31', 'OFFICIAL_SOURCE', 30),
    ('Bursa', 'general_index', 'Genel fiyat bağlamı', NULL, NULL, 'TÜİK TÜFE ülke geneli ve bölgesel fiyat değişimlerini izler; kişisel yaşam maliyeti değildir.', '2026 metodoloji', 'TÜİK Veri Portalı', 'https://veriportali.tuik.gov.tr/en/', '2026-05-16', 'OFFICIAL_SOURCE', 40),

    ('Konya', 'transport', 'Öğrenci biniş', 12.00, 'TL/biniş', NULL, '29.04.2026 itibarıyla', 'ATUS / Konya Büyükşehir Belediyesi', 'https://atus.konya.bel.tr/ulasim-ucretleri', '2026-04-29', 'OFFICIAL_SOURCE', 10),
    ('Konya', 'transport', 'Tam biniş', 29.00, 'TL/biniş', NULL, '29.04.2026 itibarıyla', 'ATUS / Konya Büyükşehir Belediyesi', 'https://atus.konya.bel.tr/ulasim-ucretleri', '2026-04-29', 'OFFICIAL_SOURCE', 20),
    ('Konya', 'housing', 'Konut ve kira göstergesi', NULL, NULL, 'TCMB Konut Fiyat Endeksi ve Yeni Kiracı Kira Endeksi EVDS üzerinden izlenir.', 'Aylık/çeyreklik seri', 'TCMB EVDS', 'https://www.tcmb.gov.tr/wps/wcm/connect/EN/TCMB%2BEN/Main%2BMenu/Statistics/Real%2BSector%2BStatistics/Residential%2BProperty%2BPrice%2BIndex/', '2026-03-31', 'OFFICIAL_SOURCE', 30),
    ('Konya', 'general_index', 'Genel fiyat bağlamı', NULL, NULL, 'TÜİK TÜFE ülke geneli ve bölgesel fiyat değişimlerini izler; kişisel yaşam maliyeti değildir.', '2026 metodoloji', 'TÜİK Veri Portalı', 'https://veriportali.tuik.gov.tr/en/', '2026-05-16', 'OFFICIAL_SOURCE', 40)
)
INSERT INTO city_cost_items (profile_id, category, label, amount, unit, value_text, period_label, source, source_url, source_date, confidence, sort_order)
SELECT p.id, s.category, s.label, s.amount, s.unit, s.value_text, s.period_label, s.source, s.source_url, s.source_date::date, s.confidence, s.sort_order
FROM seed s
JOIN profiles p ON p.city = s.city;
