CREATE TABLE university_meal_costs (
    id              BIGSERIAL PRIMARY KEY,
    university_id   BIGINT NOT NULL REFERENCES universitetler(id) ON DELETE CASCADE,
    meal_type       VARCHAR(60) NOT NULL,
    label           VARCHAR(160) NOT NULL,
    amount          NUMERIC(12,2) NOT NULL,
    unit            VARCHAR(60) NOT NULL,
    period_label    VARCHAR(80) NOT NULL,
    source          VARCHAR(120) NOT NULL,
    source_url      TEXT NOT NULL,
    source_date     DATE NOT NULL,
    confidence      VARCHAR(30) NOT NULL DEFAULT 'OFFICIAL_SOURCE',
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_university_meal_costs_university ON university_meal_costs(university_id);

WITH seed(university_name, meal_type, label, amount, unit, period_label, source, source_url, source_date, sort_order) AS (
    VALUES
    ('ORTA DOĞU TEKNİK ÜNİVERSİTESİ (ANKARA)', 'lunch_dinner', 'Öğrenci tabldot yemek', 40.00, 'TL/öğün', '25.02.2026 itibarıyla', 'ODTÜ Kafeterya Müdürlüğü', 'https://kafeterya.metu.edu.tr/node/29', '2026-02-25'::date, 10),
    ('ORTA DOĞU TEKNİK ÜNİVERSİTESİ (ANKARA)', 'breakfast', 'Öğrenci kahvaltı / çorba', 10.00, 'TL/öğün', '25.02.2026 itibarıyla', 'ODTÜ Kafeterya Müdürlüğü', 'https://kafeterya.metu.edu.tr/node/29', '2026-02-25'::date, 20),

    ('İSTANBUL TEKNİK ÜNİVERSİTESİ', 'lunch', 'Öğrenci öğle yemeği', 47.50, 'TL/öğün', '15.09.2025 itibarıyla', 'İTÜ SKS', 'https://sks.itu.edu.tr/en/meal-prices2', '2025-09-15'::date, 10),
    ('İSTANBUL TEKNİK ÜNİVERSİTESİ', 'dinner', 'Öğrenci akşam yemeği', 47.50, 'TL/öğün', '15.09.2025 itibarıyla', 'İTÜ SKS', 'https://sks.itu.edu.tr/en/meal-prices2', '2025-09-15'::date, 20),

    ('İHSAN DOĞRAMACI BİLKENT ÜNİVERSİTESİ (ANKARA)', 'meal_plan', 'Öğrenci yemek planı öğün hakkı', 113.00, 'TL/öğün', '22.01.2026 itibarıyla', 'Bilkent Kafeteryalar İşletmesi Müdürlüğü', 'https://w3.bilkent.edu.tr/www/kafeteryalar-isletmesi-mudurlugu/tabildot-yemek-plani/', '2026-01-22'::date, 10),
    ('İHSAN DOĞRAMACI BİLKENT ÜNİVERSİTESİ (ANKARA)', 'breakfast', 'Kahvaltı', 174.00, 'TL/öğün', '22.01.2026 itibarıyla', 'Bilkent Kafeteryalar İşletmesi Müdürlüğü', 'https://w3.bilkent.edu.tr/www/kafeteryalar-isletmesi-mudurlugu/tabildot-yemek-plani/', '2026-01-22'::date, 20),
    ('İHSAN DOĞRAMACI BİLKENT ÜNİVERSİTESİ (ANKARA)', 'fixed_menu', 'Fiks menü', 226.00, 'TL/öğün', '22.01.2026 itibarıyla', 'Bilkent Kafeteryalar İşletmesi Müdürlüğü', 'https://w3.bilkent.edu.tr/www/kafeteryalar-isletmesi-mudurlugu/tabildot-yemek-plani/', '2026-01-22'::date, 30),
    ('İHSAN DOĞRAMACI BİLKENT ÜNİVERSİTESİ (ANKARA)', 'alternative_menu', 'Seçmeli menü', 290.00, 'TL/öğün', '22.01.2026 itibarıyla', 'Bilkent Kafeteryalar İşletmesi Müdürlüğü', 'https://w3.bilkent.edu.tr/www/kafeteryalar-isletmesi-mudurlugu/tabildot-yemek-plani/', '2026-01-22'::date, 40),

    ('İSTANBUL ÜNİVERSİTESİ', 'breakfast', 'Öğrenci kahvaltı', 52.50, 'TL/öğün', '2025-2026', 'İstanbul Üniversitesi SKS', 'https://sks.istanbul.edu.tr/yemekhane-saatler-ve-ucretler', '2025-08-07'::date, 10),
    ('İSTANBUL ÜNİVERSİTESİ', 'lunch', 'Öğrenci öğle yemeği', 52.50, 'TL/öğün', '2025-2026', 'İstanbul Üniversitesi SKS', 'https://sks.istanbul.edu.tr/yemekhane-saatler-ve-ucretler', '2025-08-07'::date, 20),
    ('İSTANBUL ÜNİVERSİTESİ', 'dinner', 'Öğrenci akşam yemeği', 52.50, 'TL/öğün', '2025-2026', 'İstanbul Üniversitesi SKS', 'https://sks.istanbul.edu.tr/yemekhane-saatler-ve-ucretler', '2025-08-07'::date, 30)
)
INSERT INTO university_meal_costs (
    university_id, meal_type, label, amount, unit, period_label,
    source, source_url, source_date, confidence, sort_order
)
SELECT u.id, s.meal_type, s.label, s.amount, s.unit, s.period_label,
       s.source, s.source_url, s.source_date, 'OFFICIAL_SOURCE', s.sort_order
FROM seed s
JOIN universitetler u ON u.ad = s.university_name;
