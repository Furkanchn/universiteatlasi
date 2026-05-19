WITH seed(university_id, rank_value, sample_size, score_value, level_value, sort_order) AS (
    VALUES
        (126982, 7, 396, 508, 'A', 30),
        (105118, 9, 288, 503, 'A', 30),
        (115069, 12, 300, 492, 'A', 30),
        (113082, 28, 554, 458, 'B', 30),
        (102738, 32, 586, 452, 'B', 30),
        (122571, 34, 319, 450, 'B', 30),
        (115373, 46, 592, 431, 'C', 30),
        (119094, 55, 483, 422, 'C', 30),
        (103545, 60, 659, 418, 'D', 30),
        (114436, 68, 367, 412, 'D', 30),
        (337414, 70, 267, 410, 'D', 30),
        (105322, 71, 296, 409, 'D', 30),
        (133520, 77, 412, 405, 'D', 30),
        (113746, 86, 276, 393, 'D', 30),
        (107723, 103, 321, 369, 'D', 30),
        (110987, 108, 405, 351, 'FF', 30),
        (112080, 115, 385, 343, 'FF', 30),
        (116345, 137, 283, 310, 'FF', 30),
        (105196, 165, 226, 273, 'FF', 30)
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
    'satisfaction',
    'tuma_general_satisfaction_score',
    'TUMA genel memnuniyet puani',
    score_value,
    'Genel memnuniyet sirasi: ' || rank_value || '/200, duzey ' || level_value || ', N=' || sample_size,
    'puan',
    '2025',
    'UNiAR TUMA',
    'https://www.uniar.net/_files/ugd/779fe1_92f086be80fb456d8a4d96e60e018212.pdf',
    '2026-05-17'::date,
    'third_party',
    'medium',
    'UNiAR TUMA 2025 raporundaki Universitelerin Genel Memnuniyet Siralamasi tablosundan manuel derlenmistir.',
    'Sira ' || rank_value || ', N ' || sample_size || ', Genel Memnuniyet Puani ' || score_value || ', Duzey ' || level_value,
    score_value::text,
    sort_order
FROM seed
WHERE EXISTS (SELECT 1 FROM universitetler u WHERE u.id = seed.university_id)
ON CONFLICT (university_id, category, metric_key, period_label, source_name) DO UPDATE SET
    numeric_value = EXCLUDED.numeric_value,
    text_value = EXCLUDED.text_value,
    source_url = EXCLUDED.source_url,
    source_date = EXCLUDED.source_date,
    raw_value = EXCLUDED.raw_value,
    normalized_value = EXCLUDED.normalized_value,
    updated_at = NOW();
