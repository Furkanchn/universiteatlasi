WITH seed(university_id, numeric_value, text_value, raw_value, normalized_value, sort_order) AS (
    VALUES
        (102738, 3, 'ILAD/ILEDAK iletisim akreditasyonu bulunan program sayisi: 3', 'Ankara Universitesi: Gazetecilik; Radyo Televizyon Sinema; Halkla Iliskiler ve Tanitim, 01.03.2024-01.03.2029', '3', 22),
        (103545, 3, 'ILAD/ILEDAK iletisim akreditasyonu bulunan program sayisi: 3', 'Ataturk Universitesi: Gazetecilik; Halkla Iliskiler ve Tanitim; Radyo, Televizyon ve Sinema, 07.04.2023-07.04.2026', '3', 22),
        (114436, 1, 'ILAD/ILEDAK iletisim akreditasyonu bulunan program sayisi: 1', 'Inonu Universitesi: Halkla Iliskiler ve Tanitim, 10.03.2023-10.03.2026', '1', 22),
        (115373, 3, 'ILAD/ILEDAK iletisim akreditasyonu bulunan program sayisi: 3', 'Istanbul Universitesi: Gazetecilik; Halkla Iliskiler ve Tanitim; Radyo, Televizyon ve Sinema, 20.02.2025-20.02.2030', '3', 22),
        (119094, 1, 'ILAD/ILEDAK iletisim akreditasyonu bulunan program sayisi: 1', 'Marmara Universitesi: Halkla Iliskiler ve Tanitim, 12.03.2025-12.03.2030', '1', 22)
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
    'ilad_communication_accredited_program_count',
    'ILAD/ILEDAK iletisim akreditasyonu',
    numeric_value,
    text_value,
    'program',
    '2026 guncel liste',
    'ILAD/ILEDAK',
    'https://ilad.org.tr/akredite-edilen-programlar/',
    '2026-05-16'::date,
    'institutional',
    'high',
    'ILAD kamuya acik akredite edilen programlar listesinden manuel dogrulanmistir.',
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
