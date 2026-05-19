-- V6__convert_enums_to_varchar.sql
-- PostgreSQL custom enum tiplerini VARCHAR'a çevir
-- Hibernate @Enumerated(EnumType.STRING) ile uyumsuzluk yaşıyor

-- lisans_programlari
ALTER TABLE lisans_programlari
    ALTER COLUMN puan_turu    TYPE VARCHAR(10)  USING puan_turu::text,
    ALTER COLUMN ogretim_turu TYPE VARCHAR(15)  USING ogretim_turu::text;

-- universitetler
ALTER TABLE universitetler
    ALTER COLUMN tur TYPE VARCHAR(20) USING tur::text;

-- Artık kullanılmayan enum tiplerini kaldır
DROP TYPE IF EXISTS puan_turu;
DROP TYPE IF EXISTS ogretim_turu;
DROP TYPE IF EXISTS universite_turu;
