-- V12__yokatlas_snapshot_fields.sql
-- Stable fields observed in the YOK Atlas tercih-kilavuz snapshot response.

ALTER TABLE lisans_programlari
    ADD COLUMN IF NOT EXISTS osym_kilavuz_id BIGINT,
    ADD COLUMN IF NOT EXISTS eski_kilavuz_kodu VARCHAR(30),
    ADD COLUMN IF NOT EXISTS eski_birim_id BIGINT,
    ADD COLUMN IF NOT EXISTS fymk_id BIGINT,
    ADD COLUMN IF NOT EXISTS fymk_il_kodu VARCHAR(20),
    ADD COLUMN IF NOT EXISTS fymk_il_adi VARCHAR(100),
    ADD COLUMN IF NOT EXISTS fymk_ilce_kodu VARCHAR(20),
    ADD COLUMN IF NOT EXISTS fymk_ilce_adi VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ilce_kodu VARCHAR(20),
    ADD COLUMN IF NOT EXISTS ilce_adi VARCHAR(100),
    ADD COLUMN IF NOT EXISTS akreditasyon VARCHAR(100),
    ADD COLUMN IF NOT EXISTS akreditasyon_ack TEXT,
    ADD COLUMN IF NOT EXISTS uni_akreditasyon TEXT,
    ADD COLUMN IF NOT EXISTS kosul TEXT,
    ADD COLUMN IF NOT EXISTS kosul_list JSONB,
    ADD COLUMN IF NOT EXISTS min_basari_sirasi INTEGER,
    ADD COLUMN IF NOT EXISTS min_basari_sirasi_kosul TEXT,
    ADD COLUMN IF NOT EXISTS kontenjan_y34 INTEGER,
    ADD COLUMN IF NOT EXISTS kontenjan_dep INTEGER,
    ADD COLUMN IF NOT EXISTS kontenjan_meb INTEGER,
    ADD COLUMN IF NOT EXISTS kontenjan_obs INTEGER,
    ADD COLUMN IF NOT EXISTS kontenjan_sgy INTEGER,
    ADD COLUMN IF NOT EXISTS prof_sayisi INTEGER,
    ADD COLUMN IF NOT EXISTS doc_sayisi INTEGER,
    ADD COLUMN IF NOT EXISTS dou_sayisi INTEGER,
    ADD COLUMN IF NOT EXISTS ogr_gor_sayisi INTEGER,
    ADD COLUMN IF NOT EXISTS ar_gor_sayisi INTEGER;

CREATE INDEX IF NOT EXISTS idx_lisans_osym_kilavuz_id
    ON lisans_programlari(osym_kilavuz_id);

CREATE INDEX IF NOT EXISTS idx_lisans_fymk_id
    ON lisans_programlari(fymk_id);

CREATE INDEX IF NOT EXISTS idx_lisans_akreditasyon
    ON lisans_programlari(akreditasyon);
