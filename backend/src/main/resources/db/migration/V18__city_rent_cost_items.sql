DELETE FROM city_cost_items
WHERE category = 'source_note'
  AND label = 'Konut ve kira resmi veri kaynağı';

WITH profiles AS (
    SELECT id, city FROM city_cost_profiles
    WHERE city IN ('Ankara', 'İstanbul', 'İzmir', 'Antalya', 'Bursa', 'Konya')
),
seed(city, label, amount, unit, sort_order) AS (
    VALUES
    ('Ankara', 'Ortanca m² kira', 210.07, 'TL/m²', 5),
    ('Ankara', '100 m² ortanca kira', 21007.00, 'TL/ay', 6),
    ('İstanbul', 'Ortanca m² kira', 367.86, 'TL/m²', 5),
    ('İstanbul', '100 m² ortanca kira', 36786.00, 'TL/ay', 6),
    ('İzmir', 'Ortanca m² kira', 252.18, 'TL/m²', 5),
    ('İzmir', '100 m² ortanca kira', 25218.00, 'TL/ay', 6),
    ('Antalya', 'Ortanca m² kira', 230.90, 'TL/m²', 5),
    ('Antalya', '100 m² ortanca kira', 23090.00, 'TL/ay', 6),
    ('Bursa', 'Ortanca m² kira', 185.40, 'TL/m²', 5),
    ('Bursa', '100 m² ortanca kira', 18540.00, 'TL/ay', 6),
    ('Konya', 'Ortanca m² kira', 167.45, 'TL/m²', 5),
    ('Konya', '100 m² ortanca kira', 16745.00, 'TL/ay', 6)
)
INSERT INTO city_cost_items (
    profile_id, category, label, amount, unit, value_text, period_label,
    source, source_url, source_date, confidence, sort_order
)
SELECT
    p.id,
    'housing',
    s.label,
    s.amount,
    s.unit,
    NULL,
    '2025-Q4',
    'TCMB',
    'https://www.tcmb.gov.tr/wps/wcm/connect/tr/tcmb%2Btr/main%2Bmenu/istatistikler/reel%2Bsektor%2Bistatistikleri/konut%2Bfiyat%2Bendeksi/',
    '2026-02-17'::date,
    'OFFICIAL_SOURCE',
    s.sort_order
FROM seed s
JOIN profiles p ON p.city = s.city;

UPDATE city_cost_profiles
SET
    source_summary = 'Kira satırları TCMB değerleme raporu kaynaklı birim kira verilerinden; ulaşım satırları resmi belediye/kurum tarifelerinden gelir.',
    notes = 'Kira değerleri TCMB tarafından yayımlanan değerlemesi yapılan konutların ortanca birim kira verisidir. 100 m² satırı, m² kira değerinin 100 ile çarpılmış gösterimidir.',
    updated_at = NOW()
WHERE city IN ('Ankara', 'İstanbul', 'İzmir', 'Antalya', 'Bursa', 'Konya');
