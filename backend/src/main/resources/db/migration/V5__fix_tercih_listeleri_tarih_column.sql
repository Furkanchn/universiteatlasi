-- V5__fix_tercih_listeleri_tarih_column.sql
-- V1'deki yazım hatası düzeltmesi: guncelleme_tarihi → guncellenme_tarihi

ALTER TABLE tercih_listeleri
    RENAME COLUMN guncelleme_tarihi TO guncellenme_tarihi;
