WITH seed(university_id, text_value, raw_value, normalized_value, sort_order) AS (
    VALUES
        (102738, 'Tıp eğitimi akreditasyonu: 1.1.2025-1.1.2031', 'Ankara Üniversitesi (R): 1.1.2025-1.1.2031', '1.1.2025-1.1.2031', 20),
        (103545, 'Tıp eğitimi akreditasyonu: Türkçe ve İngilizce programlar, 1.1.2022-1.1.2028', 'Atatürk Üniversitesi Türkçe/İngilizce: 1.1.2022-1.1.2028', '1.1.2022-1.1.2028', 20),
        (107723, 'Tıp eğitimi akreditasyonu: 1.1.2025-1.1.2031', 'Dicle Üniversitesi (R): 1.1.2025-1.1.2031', '1.1.2025-1.1.2031', 20),
        (110987, 'Tıp eğitimi akreditasyonu: 1.1.2023-1.1.2029', 'Fırat Üniversitesi (R): 1.1.2023-1.1.2029', '1.1.2023-1.1.2029', 20),
        (112080, 'Tıp eğitimi akreditasyonu: 1.1.2025-1.1.2030', 'Gaziantep Üniversitesi (R): 1.1.2025-1.1.2030', '1.1.2025-1.1.2030', 20),
        (113082, 'Tıp eğitimi akreditasyonu: Türkçe ve İngilizce programlar, 1.1.2023-1.1.2029', 'Hacettepe Üniversitesi R/İngilizce: 1.1.2023-1.1.2029', '1.1.2023-1.1.2029', 20),
        (114436, 'Tıp eğitimi akreditasyonu: Türkçe ve İngilizce programlar, 1.1.2020-1.1.2026', 'İnönü Üniversitesi R/İngilizce: 1.1.2020-1.1.2026', '1.1.2020-1.1.2026', 20),
        (115373, 'Tıp eğitimi akreditasyonu: Türkçe program 1.1.2025-1.1.2031, İngilizce program 1.1.2025-1.1.2031', 'İstanbul Üniversitesi İstanbul R/İngilizce: 1.1.2025-1.1.2031', '1.1.2025-1.1.2031', 20),
        (119094, 'Tıp eğitimi akreditasyonu: İngilizce program, 1.1.2023-1.1.2029', 'Marmara Üniversitesi İngilizce (R): 1.1.2023-1.1.2029', '1.1.2023-1.1.2029', 20),
        (133520, 'Tıp eğitimi akreditasyonu: Türkçe program 1.1.2023-1.1.2029, İngilizce program 1.1.2024-1.1.2030', 'Gazi Üniversitesi Türkçe/İngilizce: 1.1.2023-1.1.2029; 1.1.2024-1.1.2030', '1.1.2023-1.1.2030', 20),
        (337414, 'Tıp eğitimi akreditasyonu: 1.1.2026-1.1.2032', 'Van Yüzüncü Yıl Üniversitesi: 1.1.2026-1.1.2032', '1.1.2026-1.1.2032', 20)
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
    'tepdad_medicine_accreditation',
    'TEPDAD tıp eğitimi akreditasyonu',
    NULL,
    text_value,
    NULL,
    '2026 güncel liste',
    'TEPDAD',
    'https://tepdad.org.tr/akredite-egitim-programlarinin-guncel-listesi/',
    '2026-05-16'::date,
    'institutional',
    'high',
    'TEPDAD web sitesindeki kamuya açık akredite eğitim programları listesinden manuel doğrulanmıştır.',
    raw_value,
    normalized_value,
    sort_order
FROM seed
WHERE EXISTS (SELECT 1 FROM universitetler u WHERE u.id = seed.university_id)
ON CONFLICT (university_id, category, metric_key, period_label, source_name) DO UPDATE SET
    text_value = EXCLUDED.text_value,
    raw_value = EXCLUDED.raw_value,
    normalized_value = EXCLUDED.normalized_value,
    source_date = EXCLUDED.source_date,
    updated_at = NOW();
