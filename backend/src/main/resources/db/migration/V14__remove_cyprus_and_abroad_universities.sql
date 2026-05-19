WITH target_programs AS (
    SELECT p.id
    FROM lisans_programlari p
    JOIN universitetler u ON u.id = p.universite_id
    WHERE u.sehir IN ('KIBRIS', 'BILINMIYOR')
)
DELETE FROM tercih_ogeleri
WHERE lisans_program_id IN (SELECT id FROM target_programs);

DELETE FROM universitetler
WHERE sehir IN ('KIBRIS', 'BILINMIYOR');
