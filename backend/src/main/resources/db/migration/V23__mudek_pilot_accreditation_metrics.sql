WITH seed(university_id, numeric_value, text_value, raw_value, normalized_value, sort_order) AS (
    VALUES
        (126982, 24, 'MÜDEK mühendislik akreditasyonu bulunan program sayısı: 24', 'Yıldız Teknik Üniversitesi MÜDEK blokları; YÖK Atlas MÜDEK program sayımı: 24', '24', 21),
        (113082, 12, 'MÜDEK mühendislik akreditasyonu bulunan program sayısı: 12', 'Hacettepe Üniversitesi MÜDEK bloğu; YÖK Atlas MÜDEK program sayımı: 12', '12', 21),
        (133520, 11, 'MÜDEK mühendislik akreditasyonu bulunan program sayısı: 11', 'Gazi Üniversitesi MÜDEK bloğu; YÖK Atlas MÜDEK program sayımı: 11', '11', 21),
        (119094, 8, 'MÜDEK mühendislik akreditasyonu bulunan program sayısı: 8', 'Marmara Üniversitesi MÜDEK bloğu; YÖK Atlas MÜDEK program sayımı: 8', '8', 21),
        (103545, 7, 'MÜDEK mühendislik akreditasyonu bulunan program sayısı: 7', 'Atatürk Üniversitesi MÜDEK bloğu; YÖK Atlas MÜDEK program sayımı: 7', '7', 21),
        (102738, 4, 'MÜDEK mühendislik akreditasyonu bulunan program sayısı: 4', 'Ankara Üniversitesi MÜDEK bloğu; YÖK Atlas MÜDEK program sayımı: 4', '4', 21),
        (112080, 3, 'MÜDEK mühendislik akreditasyonu bulunan program sayısı: 3', 'Gaziantep Üniversitesi MÜDEK bloğu; YÖK Atlas MÜDEK program sayımı: 3', '3', 21),
        (110987, 1, 'MÜDEK mühendislik akreditasyonu bulunan program sayısı: 1', 'Fırat Üniversitesi MÜDEK bloğu; YÖK Atlas MÜDEK program sayımı: 1', '1', 21)
)
INSERT INTO university_external_metrics (
    university_id,
    category,
    metric_key,
    label,
    numeric_value,
    text_value,
    unit,
    period_label,
    source_name,
    source_url,
    source_date,
    source_type,
    confidence,
    license_note,
    raw_value,
    normalized_value,
    sort_order
)
SELECT
    university_id,
    'accreditation',
    'mudek_engineering_accredited_program_count',
    'MÜDEK mühendislik akreditasyonu',
    numeric_value,
    text_value,
    'program',
    '2025 güncel liste',
    'MÜDEK',
    'https://www.mudek.org.tr/tr/akredit/akredite2025.shtm',
    '2026-05-16'::date,
    'institutional',
    'high',
    'MÜDEK kamuya açık akredite lisans programları listesinden doğrulanmış; program sayımı YÖK Atlas akreditasyon alanıyla eşleştirilmiştir.',
    raw_value,
    normalized_value,
    sort_order
FROM seed
WHERE EXISTS (SELECT 1 FROM universitetler u WHERE u.id = seed.university_id)
ON CONFLICT (university_id, category, metric_key, period_label, source_name) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    text_value = EXCLUDED.text_value,
    raw_value = EXCLUDED.raw_value,
    normalized_value = EXCLUDED.normalized_value,
    source_date = EXCLUDED.source_date,
    updated_at = NOW();
