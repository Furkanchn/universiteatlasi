-- V4__fix_tercih_listeleri_columns.sql
-- V1'deki yazım hatası düzeltmesi: girilelen_* → girilen_*

ALTER TABLE tercih_listeleri
    RENAME COLUMN girilelen_puan TO girilen_puan;

ALTER TABLE tercih_listeleri
    RENAME COLUMN girilelen_sira TO girilen_sira;
