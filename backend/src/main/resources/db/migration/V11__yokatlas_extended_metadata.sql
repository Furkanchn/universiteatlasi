-- V11__yokatlas_extended_metadata.sql
-- Adds storage for YOK Atlas fields that are not part of the first lisans model.
-- This migration is additive only; it does not fetch, import, or mutate existing rows.

ALTER TABLE lisans_programlari
    ADD COLUMN IF NOT EXISTS yokatlas_universite_id BIGINT,
    ADD COLUMN IF NOT EXISTS yokatlas_il_kodu VARCHAR(20),
    ADD COLUMN IF NOT EXISTS yokatlas_program_grup_id VARCHAR(50),
    ADD COLUMN IF NOT EXISTS program_grup_adi VARCHAR(255),
    ADD COLUMN IF NOT EXISTS birim_turu_id SMALLINT,
    ADD COLUMN IF NOT EXISTS birim_turu_adi VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ogrenim_turu_id SMALLINT,
    ADD COLUMN IF NOT EXISTS ogrenim_turu_adi VARCHAR(100),
    ADD COLUMN IF NOT EXISTS burs_orani_id SMALLINT,
    ADD COLUMN IF NOT EXISTS burs_orani_adi VARCHAR(100),
    ADD COLUMN IF NOT EXISTS yokatlas_raw JSONB;

ALTER TABLE lisans_yil_verileri
    ADD COLUMN IF NOT EXISTS yil_kontenjan INTEGER,
    ADD COLUMN IF NOT EXISTS kayit_yaptiran INTEGER,
    ADD COLUMN IF NOT EXISTS ek_yerlesen INTEGER,
    ADD COLUMN IF NOT EXISTS ek_kayit_yaptiran INTEGER;

CREATE TABLE IF NOT EXISTS yokatlas_program_detay_verileri (
    id BIGSERIAL PRIMARY KEY,
    program_id BIGINT NOT NULL REFERENCES lisans_programlari(id) ON DELETE CASCADE,
    yil INTEGER,
    kategori VARCHAR(80) NOT NULL,
    alt_kategori VARCHAR(120),
    veri JSONB NOT NULL,
    kaynak_url VARCHAR(500),
    olusturma_tarihi TIMESTAMP NOT NULL DEFAULT NOW(),
    guncelleme_tarihi TIMESTAMP,
    CONSTRAINT uq_yokatlas_program_detay
        UNIQUE (program_id, yil, kategori, alt_kategori)
);

CREATE TABLE IF NOT EXISTS yokatlas_import_audit (
    id BIGSERIAL PRIMARY KEY,
    kaynak VARCHAR(120) NOT NULL,
    kaynak_url VARCHAR(500),
    veri_kategorisi VARCHAR(120) NOT NULL,
    durum VARCHAR(40) NOT NULL,
    kayit_sayisi INTEGER,
    mesaj TEXT,
    baslama_tarihi TIMESTAMP NOT NULL DEFAULT NOW(),
    bitis_tarihi TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lisans_yokatlas_universite_id
    ON lisans_programlari(yokatlas_universite_id);

CREATE INDEX IF NOT EXISTS idx_lisans_yokatlas_il_kodu
    ON lisans_programlari(yokatlas_il_kodu);

CREATE INDEX IF NOT EXISTS idx_lisans_birim_turu_id
    ON lisans_programlari(birim_turu_id);

CREATE INDEX IF NOT EXISTS idx_lisans_ogrenim_turu_id
    ON lisans_programlari(ogrenim_turu_id);

CREATE INDEX IF NOT EXISTS idx_yokatlas_detay_program
    ON yokatlas_program_detay_verileri(program_id);

CREATE INDEX IF NOT EXISTS idx_yokatlas_detay_kategori
    ON yokatlas_program_detay_verileri(kategori);

CREATE INDEX IF NOT EXISTS idx_yokatlas_detay_yil
    ON yokatlas_program_detay_verileri(yil);
