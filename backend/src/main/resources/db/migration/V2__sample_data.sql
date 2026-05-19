-- V2__sample_data.sql
-- Örnek veriler (geliştirme ortamı için)

INSERT INTO universitetler (ad, sehir, bolge, tur, kuruluş_yili, website_url, ogrenci_sayisi, ogretim_uye_sayisi)
VALUES
    ('Orta Doğu Teknik Üniversitesi',    'Ankara',   'IC_ANADOLU', 'DEVLET',        1956, 'https://www.metu.edu.tr',  28000, 1800),
    ('Boğaziçi Üniversitesi',            'İstanbul', 'MARMARA',    'DEVLET',        1863, 'https://www.boun.edu.tr',  15000, 950),
    ('İstanbul Teknik Üniversitesi',     'İstanbul', 'MARMARA',    'DEVLET',        1773, 'https://www.itu.edu.tr',   35000, 2100),
    ('Hacettepe Üniversitesi',           'Ankara',   'IC_ANADOLU', 'DEVLET',        1967, 'https://www.hacettepe.edu.tr', 50000, 3000),
    ('Koç Üniversitesi',                 'İstanbul', 'MARMARA',    'VAKIF',         1993, 'https://www.ku.edu.tr',    7000,  600),
    ('Sabancı Üniversitesi',             'İstanbul', 'MARMARA',    'VAKIF',         1994, 'https://www.sabanciuniv.edu', 5000, 400),
    ('Selçuk Üniversitesi',              'Konya',    'IC_ANADOLU', 'DEVLET',        1975, 'https://www.selcuk.edu.tr', 70000, 3500),
    ('Necmettin Erbakan Üniversitesi',   'Konya',    'IC_ANADOLU', 'DEVLET',        2010, 'https://www.erbakan.edu.tr', 40000, 2000);

-- ── Lisans Programları ───────────────────────────────────
INSERT INTO lisans_programlari (universite_id, fakulte, program_adi, puan_turu, ogretim_turu, kontenjan, burs_orani)
VALUES
    (1, 'Mühendislik Fakültesi',          'Bilgisayar Mühendisliği',        'SAY', 'ORGUNLU', 150, 100),
    (1, 'Mühendislik Fakültesi',          'Elektrik-Elektronik Mühendisliği','SAY', 'ORGUNLU', 120, 100),
    (1, 'İktisadi ve İdari Bilimler Fak.','İşletme',                         'EA',  'ORGUNLU',  80, 100),
    (2, 'Mühendislik Fakültesi',          'Bilgisayar Mühendisliği',        'SAY', 'ORGUNLU',  80, 100),
    (2, 'Fen-Edebiyat Fakültesi',         'Matematik',                       'SAY', 'ORGUNLU',  60, 100),
    (3, 'Bilgisayar ve Bilişim Fak.',     'Bilgisayar Mühendisliği',        'SAY', 'ORGUNLU', 200, 100),
    (5, 'Mühendislik Fakültesi',          'Bilgisayar Mühendisliği (İng.)', 'SAY', 'ORGUNLU',  60, 50),
    (7, 'Mühendislik Fakültesi',          'Bilgisayar Mühendisliği',        'SAY', 'ORGUNLU', 100, 100),
    (7, 'İktisadi ve İdari Bilimler Fak.','İktisat',                         'EA',  'ORGUNLU',  80, 100),
    (8, 'Mühendislik ve Doğa Bil. Fak.', 'Yazılım Mühendisliği',           'SAY', 'ORGUNLU',  80, 100);

-- ── 2025 Yıl Verileri ────────────────────────────────────
INSERT INTO lisans_yil_verileri (program_id, yil, taban_puan, taban_sira, tavan_puan, tavan_sira, yerlesen, bos_kalan)
VALUES
    (1, 2025, 522.10,   1180,  536.80,   420,  149, 1),
    (1, 2024, 520.45,   1250,  535.12,   450,  148, 2),
    (1, 2023, 515.20,   1380,  530.40,   510,  149, 1),
    (2, 2025, 512.40,   1790,  527.10,   690,  119, 1),
    (2, 2024, 510.80,   1850,  525.30,   720,  118, 2),
    (3, 2025, 432.50,  17800,  450.20,  8900,   79, 1),
    (3, 2024, 430.20,  18500,  448.60,  9200,   78, 2),
    (4, 2025, 531.80,    790,  543.60,   290,   79, 1),
    (4, 2024, 530.10,    820,  542.20,   310,   79, 1),
    (5, 2025, 482.10,   5050,  496.80,  2020,   58, 2),
    (5, 2024, 480.30,   5200,  495.10,  2100,   58, 2),
    (6, 2025, 507.30,   2020,  522.10,   820,  198, 2),
    (6, 2024, 505.60,   2100,  520.80,   850,  197, 3),
    (7, 2025, 537.00,    610,  550.40,   170,   59, 1),
    (7, 2024, 535.20,    640,  548.90,   180,   59, 1),
    (8, 2025, 422.30,  24200,  440.10,  12500,  99, 1),
    (8, 2024, 420.10,  25000,  438.40,  13000,  98, 2),
    (9, 2025, 397.50,  44000,  416.80,  27200,  79, 1),
    (9, 2024, 395.80,  45000,  415.20,  28000,  78, 2),
    (10,2025, 417.20,  28100,  433.80,  17400,  79, 1),
    (10,2024, 415.60,  29000,  432.10,  18000,  78, 2);
