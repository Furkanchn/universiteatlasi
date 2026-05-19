WITH seed(university_id, text_value, raw_value, normalized_value, period_label, source_url, sort_order) AS (
    VALUES
        (103545, 'YOKAK kurumsal akreditasyon: 5 yil tam akreditasyon', 'Ataturk Universitesi: 2025 Temmuz Kurul karariyla 5 yil tam akreditasyon aldi.', '5 yil tam akreditasyon', '2025 Temmuz karari', 'https://www.yokak.gov.tr/2025/07/23/2025-yili-kurumsal-akreditasyon-programi-kapsaminda-30-universite-kurumsal-ara-degerlendirme-2-universite-kurumsal-akreditasyon-surecinden-gecti/', 10),
        (122571, 'YOKAK kurumsal akreditasyon: 5 yil tam akreditasyon devam ediyor', 'Orta Dogu Teknik Universitesi: 2025 ara degerlendirme sonucunda 5 yil tam akreditasyonunun devam etmesine karar verildi.', '5 yil tam akreditasyon devam', '2025 ara degerlendirme', 'https://www.yokak.gov.tr/2025/07/23/2025-yili-kurumsal-akreditasyon-programi-kapsaminda-30-universite-kurumsal-ara-degerlendirme-2-universite-kurumsal-akreditasyon-surecinden-gecti/', 10),
        (133520, 'YOKAK kurumsal akreditasyon: 5 yil tam akreditasyon devam ediyor', 'Gazi Universitesi: 2025 ara degerlendirme sonucunda 5 yil tam akreditasyonunun devam etmesine karar verildi.', '5 yil tam akreditasyon devam', '2025 ara degerlendirme', 'https://www.yokak.gov.tr/2025/07/23/2025-yili-kurumsal-akreditasyon-programi-kapsaminda-30-universite-kurumsal-ara-degerlendirme-2-universite-kurumsal-akreditasyon-surecinden-gecti/', 10),
        (110987, 'YOKAK kurumsal akreditasyon: kosulludan 5 yil tam akreditasyona donustu', 'Firat Universitesi: 2025 Temmuz Kurul karariyla kosullu akreditasyonu 5 yillik tam akreditasyona donusturuldu.', 'kosulludan 5 yil tam akreditasyona donustu', '2025 Temmuz karari', 'https://www.yokak.gov.tr/2025/07/23/2025-yili-kurumsal-akreditasyon-programi-kapsaminda-30-universite-kurumsal-ara-degerlendirme-2-universite-kurumsal-akreditasyon-surecinden-gecti/', 10),
        (113746, 'YOKAK kurumsal akreditasyon: kosulludan 5 yil tam akreditasyona donustu', 'Harran Universitesi: 2025 Temmuz Kurul karariyla kosullu akreditasyonu 5 yillik tam akreditasyona donusturuldu.', 'kosulludan 5 yil tam akreditasyona donustu', '2025 Temmuz karari', 'https://www.yokak.gov.tr/2025/07/23/2025-yili-kurumsal-akreditasyon-programi-kapsaminda-30-universite-kurumsal-ara-degerlendirme-2-universite-kurumsal-akreditasyon-surecinden-gecti/', 10),
        (114436, 'YOKAK kurumsal akreditasyon: kosulludan 5 yil tam akreditasyona donustu', 'Inonu Universitesi: 2025 Temmuz Kurul karariyla kosullu akreditasyonu 5 yillik tam akreditasyona donusturuldu.', 'kosulludan 5 yil tam akreditasyona donustu', '2025 Temmuz karari', 'https://www.yokak.gov.tr/2025/07/23/2025-yili-kurumsal-akreditasyon-programi-kapsaminda-30-universite-kurumsal-ara-degerlendirme-2-universite-kurumsal-akreditasyon-surecinden-gecti/', 10),
        (105196, 'YOKAK kurumsal akreditasyon: 2 yil kosullu akreditasyon', 'Bingol Universitesi: 2025 yili Kurumsal Akreditasyon Programi kapsaminda 2 yil kosullu akreditasyon aldi.', '2 yil kosullu akreditasyon', '2025 KAP', 'https://www.yokak.gov.tr/2026/03/12/yuksekogretim-kalite-kurulundan-39-universiteye-kurumsal-akreditasyon/', 10)
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
    'yokak_institutional_accreditation',
    'YOKAK kurumsal akreditasyon',
    NULL,
    text_value,
    NULL,
    period_label,
    'YOKAK',
    source_url,
    '2026-05-17'::date,
    'official',
    'high',
    'YOKAK resmi duyurularindan manuel dogrulanmistir.',
    raw_value,
    normalized_value,
    sort_order
FROM seed
WHERE EXISTS (SELECT 1 FROM universitetler u WHERE u.id = seed.university_id)
ON CONFLICT (university_id, category, metric_key, period_label, source_name) DO UPDATE SET
    text_value = EXCLUDED.text_value,
    source_url = EXCLUDED.source_url,
    source_date = EXCLUDED.source_date,
    raw_value = EXCLUDED.raw_value,
    normalized_value = EXCLUDED.normalized_value,
    updated_at = NOW();
