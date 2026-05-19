-- V3__yokatlas_columns.sql
-- YÖKAtlas verisi için şema güncellemeleri

-- lisans_programlari: ogretim_turu JSON'da yok → nullable
ALTER TABLE lisans_programlari
    ALTER COLUMN ogretim_turu DROP NOT NULL;

-- lisans_programlari: YÖKAtlas'tan gelen yeni alanlar
ALTER TABLE lisans_programlari
    ADD COLUMN IF NOT EXISTS program_kodu      VARCHAR(20)  UNIQUE,
    ADD COLUMN IF NOT EXISTS dil               VARCHAR(50),
    ADD COLUMN IF NOT EXISTS ogretim_suresi_yil SMALLINT,
    ADD COLUMN IF NOT EXISTS detail_url        VARCHAR(500);

-- universitetler: şehir/bölge/tur YÖKAtlas verisinde yok
ALTER TABLE universitetler
    ALTER COLUMN sehir DROP NOT NULL,
    ALTER COLUMN bolge DROP NOT NULL,
    ALTER COLUMN tur   DROP NOT NULL;

-- universitetler: ad üzerinde unique constraint (seed için gerekli)
ALTER TABLE universitetler
    ADD CONSTRAINT uq_universitetler_ad UNIQUE (ad);

-- universitetler: YÖKAtlas slug'ı
ALTER TABLE universitetler
    ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
