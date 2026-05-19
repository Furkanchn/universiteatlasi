-- ID 1-8: elle oluşturulmuş boş yer tutucu kayıtlar.
-- Gerçek veriler YÖK Atlas importuyla gelen yüksek ID'li kayıtlarda mevcut.
-- Eşleşmeler: 1↔122571, 2↔105322, 3↔115069, 4↔113082, 5↔118853, 6↔123400, 7↔123902, 8↔173500

DELETE FROM university_external_metrics WHERE university_id IN (1,2,3,4,5,6,7,8);
DELETE FROM lisans_programlari          WHERE universite_id  IN (1,2,3,4,5,6,7,8);
DELETE FROM universitetler              WHERE id             IN (1,2,3,4,5,6,7,8);
