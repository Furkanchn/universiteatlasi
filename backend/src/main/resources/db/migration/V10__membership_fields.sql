ALTER TABLE kullanicilar
    ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'USER',
    ADD COLUMN IF NOT EXISTS aktif BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS guncelleme_tarihi TIMESTAMP;

UPDATE kullanicilar
SET role = 'USER'
WHERE role IS NULL OR TRIM(role) = '';

CREATE INDEX IF NOT EXISTS idx_kullanici_aktif ON kullanicilar(aktif);
