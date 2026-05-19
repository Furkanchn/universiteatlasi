-- Üniversite Atlası veri kalite kontrolleri
-- Kullanım: psql bağlantısı açıkken bu dosyayı çalıştırın.

-- Şehir bilgisi eksik üniversiteler.
SELECT id, ad
FROM universitetler
WHERE sehir IS NULL OR btrim(sehir) = ''
ORDER BY ad;

-- Program adı veya üniversite bağlantısı eksik lisans kayıtları.
SELECT lp.id, lp.program_adi, lp.universite_id
FROM lisans_programlari lp
LEFT JOIN universitetler u ON u.id = lp.universite_id
WHERE lp.program_adi IS NULL
   OR btrim(lp.program_adi) = ''
   OR u.id IS NULL
ORDER BY lp.id;

-- Yıl verisi olmayan lisans programları.
SELECT lp.id, lp.program_adi
FROM lisans_programlari lp
LEFT JOIN lisans_yil_verileri lyv ON lyv.program_id = lp.id
WHERE lyv.id IS NULL
ORDER BY lp.program_adi;

-- Taban değerleri tavan değerlerinden büyük görünen kayıtlar.
SELECT program_id, yil, taban_puan, tavan_puan, taban_sira, tavan_sira
FROM lisans_yil_verileri
WHERE (taban_puan IS NOT NULL AND tavan_puan IS NOT NULL AND taban_puan > tavan_puan)
   OR (taban_sira IS NOT NULL AND tavan_sira IS NOT NULL AND tavan_sira > taban_sira)
ORDER BY yil DESC, program_id;

-- Kontenjan ve yerleşen sayısı tutarsızlıkları.
SELECT lp.id, lp.program_adi, lp.kontenjan, lyv.yil, lyv.yerlesen, lyv.bos_kalan
FROM lisans_programlari lp
JOIN lisans_yil_verileri lyv ON lyv.program_id = lp.id
WHERE lp.kontenjan < 0
   OR lyv.yerlesen < 0
   OR lyv.bos_kalan < 0
   OR (lp.kontenjan IS NOT NULL AND lyv.yerlesen IS NOT NULL AND lyv.yerlesen > lp.kontenjan)
ORDER BY lyv.yil DESC, lp.program_adi;
