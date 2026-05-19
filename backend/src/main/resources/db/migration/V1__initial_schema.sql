-- V1__initial_schema.sql
-- Flyway migration: İlk veritabanı şeması
-- Çalışma sırası: Flyway otomatik çalıştırır (uygulama başlangıcında)

-- ── Enum tipleri ────────────────────────────────────────
CREATE TYPE universite_turu  AS ENUM ('DEVLET', 'VAKIF', 'VAKIF_UCRETLI');
CREATE TYPE puan_turu        AS ENUM ('SAY', 'EA', 'SOZ', 'DIL', 'TYT');
CREATE TYPE ogretim_turu     AS ENUM ('ORGUNLU', 'IKINDI', 'UZAKTAN');

-- ── Üniversiteler ────────────────────────────────────────
CREATE TABLE universitetler (
    id                  BIGSERIAL PRIMARY KEY,
    ad                  VARCHAR(255) NOT NULL,
    sehir               VARCHAR(100) NOT NULL,
    bolge               VARCHAR(50)  NOT NULL,
    tur                 universite_turu NOT NULL,
    kuruluş_yili        INTEGER,
    website_url         VARCHAR(500),
    logo_url            VARCHAR(500),
    ogrenci_sayisi      INTEGER,
    ogretim_uye_sayisi  INTEGER,
    yurt_kapasitesi     INTEGER
);

CREATE INDEX idx_universite_sehir ON universitetler(sehir);
CREATE INDEX idx_universite_tur   ON universitetler(tur);

-- ── Lisans Programları ────────────────────────────────────
CREATE TABLE lisans_programlari (
    id              BIGSERIAL PRIMARY KEY,
    universite_id   BIGINT NOT NULL REFERENCES universitetler(id) ON DELETE CASCADE,
    fakulte         VARCHAR(255) NOT NULL,
    program_adi     VARCHAR(255) NOT NULL,
    puan_turu       puan_turu    NOT NULL,
    ogretim_turu    ogretim_turu NOT NULL,
    kontenjan       INTEGER      NOT NULL,
    burs_orani      INTEGER      NOT NULL DEFAULT 0,
    ucret           NUMERIC(10,2)
);

CREATE INDEX idx_lisans_universite_id ON lisans_programlari(universite_id);
CREATE INDEX idx_lisans_puan_turu     ON lisans_programlari(puan_turu);
CREATE INDEX idx_lisans_program_adi   ON lisans_programlari(program_adi);

-- ── Lisans Yıllık Verileri ────────────────────────────────
CREATE TABLE lisans_yil_verileri (
    id              BIGSERIAL PRIMARY KEY,
    program_id      BIGINT NOT NULL REFERENCES lisans_programlari(id) ON DELETE CASCADE,
    yil             INTEGER NOT NULL,
    taban_puan      NUMERIC(8,4),
    taban_sira      INTEGER,
    tavan_puan      NUMERIC(8,4),
    tavan_sira      INTEGER,
    yerlesen        INTEGER,
    bos_kalan       INTEGER,
    UNIQUE (program_id, yil)
);

CREATE INDEX idx_lisans_yil        ON lisans_yil_verileri(yil);
CREATE INDEX idx_lisans_taban_sira ON lisans_yil_verileri(taban_sira);

-- ── Kullanıcılar ──────────────────────────────────────────
CREATE TABLE kullanicilar (
    id                VARCHAR(36) PRIMARY KEY,  -- UUID
    email             VARCHAR(255) NOT NULL UNIQUE,
    sifre_hash        VARCHAR(255) NOT NULL,
    ad                VARCHAR(100),
    olusturma_tarihi  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kullanici_email ON kullanicilar(email);

-- ── Tercih Listeleri ─────────────────────────────────────
CREATE TABLE tercih_listeleri (
    id                  VARCHAR(36) PRIMARY KEY,
    kullanici_id        VARCHAR(36) NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
    ad                  VARCHAR(100) NOT NULL DEFAULT 'Tercih Listem',
    ogrenim_duzeyi      VARCHAR(10)  NOT NULL,
    girilelen_puan      NUMERIC(8,4),
    girilelen_sira      INTEGER,
    olusturma_tarihi    TIMESTAMP NOT NULL DEFAULT NOW(),
    guncelleme_tarihi   TIMESTAMP
);

-- ── Tercih Öğeleri ──────────────────────────────────────
CREATE TABLE tercih_ogeleri (
    id                  VARCHAR(36) PRIMARY KEY,
    liste_id            VARCHAR(36) NOT NULL REFERENCES tercih_listeleri(id) ON DELETE CASCADE,
    sira                INTEGER NOT NULL,
    lisans_program_id   BIGINT REFERENCES lisans_programlari(id),
    notlar              TEXT
);

CREATE INDEX idx_tercih_liste_id ON tercih_ogeleri(liste_id);
