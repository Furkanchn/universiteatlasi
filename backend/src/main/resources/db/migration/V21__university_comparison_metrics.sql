CREATE TABLE university_external_metrics (
    id                BIGSERIAL PRIMARY KEY,
    university_id     BIGINT NOT NULL REFERENCES universitetler(id) ON DELETE CASCADE,
    category          VARCHAR(40) NOT NULL,
    metric_key        VARCHAR(80) NOT NULL,
    label             VARCHAR(160) NOT NULL,
    numeric_value     NUMERIC(12, 2),
    text_value        VARCHAR(255),
    unit              VARCHAR(40),
    period_label      VARCHAR(80) NOT NULL,
    source_name       VARCHAR(120) NOT NULL,
    source_url        VARCHAR(500) NOT NULL,
    source_date       DATE NOT NULL,
    retrieved_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    source_type       VARCHAR(40) NOT NULL,
    confidence        VARCHAR(20) NOT NULL,
    license_note      VARCHAR(255),
    raw_value         VARCHAR(255),
    normalized_value  VARCHAR(255),
    sort_order        INTEGER NOT NULL DEFAULT 100,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT university_external_metrics_category_check
        CHECK (category IN ('academic', 'accreditation', 'campus', 'satisfaction', 'reputation', 'source_note')),
    CONSTRAINT university_external_metrics_source_type_check
        CHECK (source_type IN ('official', 'institutional', 'open_data', 'third_party', 'manual_review')),
    CONSTRAINT university_external_metrics_confidence_check
        CHECK (confidence IN ('high', 'medium', 'low'))
);

CREATE INDEX idx_university_external_metrics_university
    ON university_external_metrics(university_id, category, sort_order);

CREATE UNIQUE INDEX uq_university_external_metric
    ON university_external_metrics(university_id, category, metric_key, period_label, source_name);

WITH seed(university_id, metric_key, label, numeric_value, text_value, unit, period_label, source_name, source_url, source_date, raw_value, normalized_value, sort_order) AS (
    VALUES
        (122571, 'urap_overall_rank', 'URAP Türkiye genel sırası', 3, NULL, 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '3', '3', 10),
        (122571, 'urap_group_rank', 'URAP grup sırası', 1, 'Tıp fakültesi olmayan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '1', '1', 11),
        (122571, 'urap_total_score', 'URAP toplam puanı', 910.61, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '910.61', '910.61', 12),

        (115069, 'urap_overall_rank', 'URAP Türkiye genel sırası', 5, NULL, 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '5', '5', 10),
        (115069, 'urap_group_rank', 'URAP grup sırası', 2, 'Tıp fakültesi olmayan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '2', '2', 11),
        (115069, 'urap_total_score', 'URAP toplam puanı', 902.36, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '902.36', '902.36', 12),

        (102738, 'urap_overall_rank', 'URAP Türkiye genel sırası', 4, NULL, 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '4', '4', 10),
        (102738, 'urap_group_rank', 'URAP grup sırası', 3, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '3', '3', 11),
        (102738, 'urap_total_score', 'URAP toplam puanı', 904.37, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '904.37', '904.37', 12),

        (115373, 'urap_overall_rank', 'URAP Türkiye genel sırası', 6, NULL, 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '6', '6', 10),
        (115373, 'urap_group_rank', 'URAP grup sırası', 4, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '4', '4', 11),
        (115373, 'urap_total_score', 'URAP toplam puanı', 888.90, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '888.90', '888.90', 12),

        (105118, 'urap_overall_rank', 'URAP Türkiye genel sırası', 20, NULL, 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '20', '20', 10),
        (105118, 'urap_group_rank', 'URAP grup sırası', 6, 'Tıp fakültesi olmayan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '6', '6', 11),
        (105118, 'urap_total_score', 'URAP toplam puanı', 768.58, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '768.58', '768.58', 12),

        (105322, 'urap_overall_rank', 'URAP Türkiye genel sırası', 22, NULL, 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '22', '22', 10),
        (105322, 'urap_group_rank', 'URAP grup sırası', 7, 'Tıp fakültesi olmayan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '7', '7', 11),
        (105322, 'urap_total_score', 'URAP toplam puanı', 760.89, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '760.89', '760.89', 12),

        (126982, 'urap_overall_rank', 'URAP Türkiye genel sırası', 12, NULL, 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '12', '12', 10),
        (126982, 'urap_group_rank', 'URAP grup sırası', 4, 'Tıp fakültesi olmayan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '4', '4', 11),
        (126982, 'urap_total_score', 'URAP toplam puanı', 821.03, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '821.03', '821.03', 12),

        (113082, 'urap_overall_rank', 'URAP Türkiye genel sırası', 2, NULL, 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '2', '2', 10),
        (113082, 'urap_group_rank', 'URAP grup sırası', 2, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '2', '2', 11),
        (113082, 'urap_total_score', 'URAP toplam puanı', 948.64, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '948.64', '948.64', 12),

        (133520, 'urap_overall_rank', 'URAP Türkiye genel sırası', 7, NULL, 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '7', '7', 10),
        (133520, 'urap_group_rank', 'URAP grup sırası', 5, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '5', '5', 11),
        (133520, 'urap_total_score', 'URAP toplam puanı', 886.23, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '886.23', '886.23', 12),

        (119094, 'urap_overall_rank', 'URAP Türkiye genel sırası', 13, NULL, 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '13', '13', 10),
        (119094, 'urap_group_rank', 'URAP grup sırası', 9, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '9', '9', 11),
        (119094, 'urap_total_score', 'URAP toplam puanı', 812.38, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '812.38', '812.38', 12),

        (103545, 'urap_overall_rank', 'URAP Türkiye genel sırası', 11, NULL, 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '11', '11', 10),
        (103545, 'urap_group_rank', 'URAP grup sırası', 8, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '8', '8', 11),
        (103545, 'urap_total_score', 'URAP toplam puanı', 821.04, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '821.04', '821.04', 12),

        (110987, 'urap_overall_rank', 'URAP Türkiye genel sırası', 17, NULL, 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '17', '17', 10),
        (110987, 'urap_group_rank', 'URAP grup sırası', 12, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '12', '12', 11),
        (110987, 'urap_total_score', 'URAP toplam puanı', 778.89, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '778.89', '778.89', 12),

        (114436, 'urap_group_rank', 'URAP grup sırası', 22, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '22', '22', 11),
        (114436, 'urap_total_score', 'URAP toplam puanı', 705.45, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '705.45', '705.45', 12),

        (112080, 'urap_group_rank', 'URAP grup sırası', 35, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '35', '35', 11),
        (112080, 'urap_total_score', 'URAP toplam puanı', 649.82, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '649.82', '649.82', 12),

        (337414, 'urap_group_rank', 'URAP grup sırası', 32, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '32', '32', 11),
        (337414, 'urap_total_score', 'URAP toplam puanı', 673.88, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '673.88', '673.88', 12),

        (107723, 'urap_group_rank', 'URAP grup sırası', 66, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '66', '66', 11),
        (107723, 'urap_total_score', 'URAP toplam puanı', 551.83, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '551.83', '551.83', 12),

        (113746, 'urap_group_rank', 'URAP grup sırası', 37, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '37', '37', 11),
        (113746, 'urap_total_score', 'URAP toplam puanı', 648.63, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '648.63', '648.63', 12),

        (116345, 'urap_group_rank', 'URAP grup sırası', 72, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '72', '72', 11),
        (116345, 'urap_total_score', 'URAP toplam puanı', 512.88, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '512.88', '512.88', 12),

        (370189, 'urap_group_rank', 'URAP grup sırası', 60, 'Tıp fakültesi olan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '60', '60', 11),
        (370189, 'urap_total_score', 'URAP toplam puanı', 562.12, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '562.12', '562.12', 12),

        (105196, 'urap_group_rank', 'URAP grup sırası', 14, 'Tıp fakültesi olmayan üniversiteler', 'sıra', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '14', '14', 11),
        (105196, 'urap_total_score', 'URAP toplam puanı', 615.49, NULL, 'puan', '2024-2025', 'URAP', 'https://newtr.urapcenter.org/cdn/storage/PDFs/dAEB5abMWAnuA7Nj4/original/dAEB5abMWAnuA7Nj4.pdf', '2025-10-01'::date, '615.49', '615.49', 12)
)
INSERT INTO university_external_metrics (
    university_id, category, metric_key, label, numeric_value, text_value, unit,
    period_label, source_name, source_url, source_date, source_type, confidence,
    license_note, raw_value, normalized_value, sort_order
)
SELECT
    university_id, 'academic', metric_key, label, numeric_value, text_value, unit,
    period_label, source_name, source_url, source_date, 'third_party', 'high',
    'Kamuya açık URAP PDF raporundan manuel doğrulanan pilot veri.',
    raw_value, normalized_value, sort_order
FROM seed
WHERE EXISTS (SELECT 1 FROM universitetler u WHERE u.id = seed.university_id);
