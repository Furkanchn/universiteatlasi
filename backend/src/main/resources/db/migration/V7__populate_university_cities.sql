-- V7__populate_university_cities.sql
-- Üniversitelerin sehir sütununu doldur

-- ── Adı içinde şehir geçenler (ILIKE ile) ──────────────
UPDATE universitetler SET sehir = 'Adana'          WHERE ad ILIKE '%ADANA%';
UPDATE universitetler SET sehir = 'Adıyaman'       WHERE ad ILIKE '%ADIYAMAN%';
UPDATE universitetler SET sehir = 'Afyonkarahisar' WHERE ad ILIKE '%AFYON%';
UPDATE universitetler SET sehir = 'Ağrı'           WHERE ad ILIKE '%AĞRI%';
UPDATE universitetler SET sehir = 'Amasya'         WHERE ad ILIKE '%AMASYA%';
UPDATE universitetler SET sehir = 'Ankara'         WHERE ad ILIKE '%ANKARA%';
UPDATE universitetler SET sehir = 'Antalya'        WHERE ad ILIKE '%ANTALYA%';
UPDATE universitetler SET sehir = 'Ardahan'        WHERE ad ILIKE '%ARDAHAN%';
UPDATE universitetler SET sehir = 'Artvin'         WHERE ad ILIKE '%ARTVİN%';
UPDATE universitetler SET sehir = 'Aydın'          WHERE ad ILIKE '%AYDIN%' AND sehir IS NULL;
UPDATE universitetler SET sehir = 'Balıkesir'      WHERE ad ILIKE '%BALIKESİR%';
UPDATE universitetler SET sehir = 'Bartın'         WHERE ad ILIKE '%BARTIN%';
UPDATE universitetler SET sehir = 'Batman'         WHERE ad ILIKE '%BATMAN%';
UPDATE universitetler SET sehir = 'Bayburt'        WHERE ad ILIKE '%BAYBURT%';
UPDATE universitetler SET sehir = 'Bilecik'        WHERE ad ILIKE '%BİLECİK%';
UPDATE universitetler SET sehir = 'Bingöl'         WHERE ad ILIKE '%BİNGÖL%';
UPDATE universitetler SET sehir = 'Bitlis'         WHERE ad ILIKE '%BİTLİS%';
UPDATE universitetler SET sehir = 'Bolu'           WHERE ad ILIKE '%BOLU%';
UPDATE universitetler SET sehir = 'Burdur'         WHERE ad ILIKE '%BURDUR%';
UPDATE universitetler SET sehir = 'Bursa'          WHERE ad ILIKE '%BURSA%';
UPDATE universitetler SET sehir = 'Çanakkale'      WHERE ad ILIKE '%ÇANAKKALE%';
UPDATE universitetler SET sehir = 'Çankırı'        WHERE ad ILIKE '%ÇANKIRI%';
UPDATE universitetler SET sehir = 'Denizli'        WHERE ad ILIKE '%PAMUKKALE%';
UPDATE universitetler SET sehir = 'Düzce'          WHERE ad ILIKE '%DÜZCE%';
UPDATE universitetler SET sehir = 'Diyarbakır'     WHERE ad ILIKE '%DİCLE%';
UPDATE universitetler SET sehir = 'Edirne'         WHERE ad ILIKE '%TRAKYA%';
UPDATE universitetler SET sehir = 'Elazığ'         WHERE ad ILIKE '%FIRAT%';
UPDATE universitetler SET sehir = 'Erzincan'       WHERE ad ILIKE '%ERZİNCAN%';
UPDATE universitetler SET sehir = 'Erzurum'        WHERE ad ILIKE '%ERZURUM%';
UPDATE universitetler SET sehir = 'Eskişehir'      WHERE ad ILIKE '%ESKİŞEHİR%';
UPDATE universitetler SET sehir = 'Gaziantep'      WHERE ad ILIKE '%GAZİANTEP%';
UPDATE universitetler SET sehir = 'Giresun'        WHERE ad ILIKE '%GİRESUN%';
UPDATE universitetler SET sehir = 'Gümüşhane'      WHERE ad ILIKE '%GÜMÜŞHANE%';
UPDATE universitetler SET sehir = 'Hakkari'        WHERE ad ILIKE '%HAKKARİ%';
UPDATE universitetler SET sehir = 'Hatay'          WHERE ad ILIKE '%HATAY%' OR ad ILIKE '%İSKENDERUN%';
UPDATE universitetler SET sehir = 'Iğdır'          WHERE ad ILIKE '%IĞDIR%';
UPDATE universitetler SET sehir = 'Isparta'        WHERE ad ILIKE '%ISPARTA%';
UPDATE universitetler SET sehir = 'İstanbul'       WHERE ad ILIKE '%İSTANBUL%';
UPDATE universitetler SET sehir = 'İzmir'          WHERE ad ILIKE '%İZMİR%';
UPDATE universitetler SET sehir = 'Kahramanmaraş'  WHERE ad ILIKE '%KAHRAMANMARAŞ%';
UPDATE universitetler SET sehir = 'Karabük'        WHERE ad ILIKE '%KARABÜK%';
UPDATE universitetler SET sehir = 'Karaman'        WHERE ad ILIKE '%KARAMANOĞLU%';
UPDATE universitetler SET sehir = 'Kars'           WHERE ad ILIKE '%KAFKAS%';
UPDATE universitetler SET sehir = 'Kastamonu'      WHERE ad ILIKE '%KASTAMONU%';
UPDATE universitetler SET sehir = 'Kayseri'        WHERE ad ILIKE '%KAYSERİ%' OR ad ILIKE '%ERCİYES%';
UPDATE universitetler SET sehir = 'Kilis'          WHERE ad ILIKE '%KİLİS%';
UPDATE universitetler SET sehir = 'Kırıkkale'      WHERE ad ILIKE '%KIRIKKALE%';
UPDATE universitetler SET sehir = 'Kırklareli'     WHERE ad ILIKE '%KIRKLARELİ%';
UPDATE universitetler SET sehir = 'Kırşehir'       WHERE ad ILIKE '%KIRŞEHİR%';
UPDATE universitetler SET sehir = 'Kocaeli'        WHERE ad ILIKE '%KOCAELİ%' OR ad ILIKE '%GEBZE%';
UPDATE universitetler SET sehir = 'Konya'          WHERE ad ILIKE '%KONYA%' OR ad ILIKE '%SELÇUK%' OR ad ILIKE '%NECMETTİN ERBAKAN%' OR ad ILIKE '%KTO%';
UPDATE universitetler SET sehir = 'Kütahya'        WHERE ad ILIKE '%KÜTAHYA%';
UPDATE universitetler SET sehir = 'Malatya'        WHERE ad ILIKE '%MALATYA%' OR ad ILIKE '%İNÖNÜ%';
UPDATE universitetler SET sehir = 'Manisa'         WHERE ad ILIKE '%MANİSA%';
UPDATE universitetler SET sehir = 'Mardin'         WHERE ad ILIKE '%MARDİN%';
UPDATE universitetler SET sehir = 'Mersin'         WHERE ad ILIKE '%MERSİN%' OR ad ILIKE '%TARSUS%';
UPDATE universitetler SET sehir = 'Muğla'          WHERE ad ILIKE '%MUĞLA%';
UPDATE universitetler SET sehir = 'Muş'            WHERE ad ILIKE '%ALPARSLAN%' AND ad ILIKE '%MUŞ%';
UPDATE universitetler SET sehir = 'Nevşehir'       WHERE ad ILIKE '%NEVŞEHİR%' OR ad ILIKE '%KAPADOKYA%';
UPDATE universitetler SET sehir = 'Niğde'          WHERE ad ILIKE '%NİĞDE%';
UPDATE universitetler SET sehir = 'Ordu'           WHERE ad ILIKE '%ORDU%';
UPDATE universitetler SET sehir = 'Osmaniye'       WHERE ad ILIKE '%OSMANİYE%';
UPDATE universitetler SET sehir = 'Rize'           WHERE ad ILIKE '%RECEP TAYYİP ERDOĞAN%';
UPDATE universitetler SET sehir = 'Sakarya'        WHERE ad ILIKE '%SAKARYA%';
UPDATE universitetler SET sehir = 'Samsun'         WHERE ad ILIKE '%SAMSUN%' OR ad ILIKE '%ONDOKUZ MAYIS%';
UPDATE universitetler SET sehir = 'Siirt'          WHERE ad ILIKE '%SİİRT%';
UPDATE universitetler SET sehir = 'Sinop'          WHERE ad ILIKE '%SİNOP%';
UPDATE universitetler SET sehir = 'Sivas'          WHERE ad ILIKE '%SİVAS%';
UPDATE universitetler SET sehir = 'Şırnak'         WHERE ad ILIKE '%ŞIRNAK%';
UPDATE universitetler SET sehir = 'Tekirdağ'       WHERE ad ILIKE '%TEKİRDAĞ%' OR ad ILIKE '%NAMIK KEMAL%';
UPDATE universitetler SET sehir = 'Tokat'          WHERE ad ILIKE '%TOKAT%';
UPDATE universitetler SET sehir = 'Trabzon'        WHERE ad ILIKE '%TRABZON%' OR ad ILIKE '%KARADENİZ TEKNİK%';
UPDATE universitetler SET sehir = 'Tunceli'        WHERE ad ILIKE '%MUNZUR%';
UPDATE universitetler SET sehir = 'Uşak'           WHERE ad ILIKE '%UŞAK%';
UPDATE universitetler SET sehir = 'Van'            WHERE ad ILIKE '%VAN YÜZÜNCÜ%';
UPDATE universitetler SET sehir = 'Yalova'         WHERE ad ILIKE '%YALOVA%';
UPDATE universitetler SET sehir = 'Yozgat'         WHERE ad ILIKE '%YOZGAT%';
UPDATE universitetler SET sehir = 'Zonguldak'      WHERE ad ILIKE '%ZONGULDAK%';

-- ── Adında şehir geçmeyen Ankara üniversiteleri ─────────
UPDATE universitetler SET sehir = 'Ankara' WHERE ad IN (
    'ATILIM ÜNİVERSİTESİ',
    'BAŞKENT ÜNİVERSİTESİ',
    'GAZİ ÜNİVERSİTESİ',
    'HACETTEPE ÜNİVERSİTESİ',
    'İHSAN DOĞRAMACI BİLKENT ÜNİVERSİTESİ',
    'LOKMAN HEKİM ÜNİVERSİTESİ',
    'ORTA DOĞU TEKNİK ÜNİVERSİTESİ',
    'OSTİM TEKNİK ÜNİVERSİTESİ',
    'TED ÜNİVERSİTESİ',
    'TOBB EKONOMİ VE TEKNOLOJİ ÜNİVERSİTESİ',
    'TÜRK HAVA KURUMU ÜNİVERSİTESİ',
    'UFUK ÜNİVERSİTESİ',
    'ÇANKAYA ÜNİVERSİTESİ'
);

-- ── Adında şehir geçmeyen İstanbul üniversiteleri ───────
UPDATE universitetler SET sehir = 'İstanbul' WHERE ad IN (
    'ALTINBAŞ ÜNİVERSİTESİ',
    'BAHÇEŞEHİR ÜNİVERSİTESİ',
    'BEYKOZ ÜNİVERSİTESİ',
    'BEZM-İ ÂLEM VAKIF ÜNİVERSİTESİ',
    'BİRUNİ ÜNİVERSİTESİ',
    'BOĞAZİÇİ ÜNİVERSİTESİ',
    'DEMİROĞLU BİLİM ÜNİVERSİTESİ',
    'DOĞUŞ ÜNİVERSİTESİ',
    'FATİH SULTAN MEHMET VAKIF ÜNİVERSİTESİ',
    'FENERBAHÇE ÜNİVERSİTESİ',
    'GALATASARAY ÜNİVERSİTESİ',
    'HALİÇ ÜNİVERSİTESİ',
    'IBN HALDUN ÜNİVERSİTESİ',
    'İBN HALDUN ÜNİVERSİTESİ',
    'IŞIK ÜNİVERSİTESİ',
    'İSTİNYE ÜNİVERSİTESİ',
    'KADİR HAS ÜNİVERSİTESİ',
    'KOÇ ÜNİVERSİTESİ',
    'MALTEPE ÜNİVERSİTESİ',
    'MARMARA ÜNİVERSİTESİ',
    'MEF ÜNİVERSİTESİ',
    'MİMAR SİNAN GÜZEL SANATLAR ÜNİVERSİTESİ',
    'PİRİ REİS ÜNİVERSİTESİ',
    'SABANCI ÜNİVERSİTESİ',
    'SAĞLIK BİLİMLERİ ÜNİVERSİTESİ',
    'TÜRK-ALMAN ÜNİVERSİTESİ',
    'ÜSKÜDAR ÜNİVERSİTESİ',
    'YEDİTEPE ÜNİVERSİTESİ',
    'YILDIZ TEKNİK ÜNİVERSİTESİ'
);

-- ── Adında şehir geçmeyen İzmir üniversiteleri ──────────
UPDATE universitetler SET sehir = 'İzmir' WHERE ad IN (
    'DOKUZ EYLÜL ÜNİVERSİTESİ',
    'EGE ÜNİVERSİTESİ',
    'YAŞAR ÜNİVERSİTESİ'
);

-- ── Diğer özel durumlar ─────────────────────────────────
UPDATE universitetler SET sehir = 'Eskişehir'  WHERE ad = 'ANADOLU ÜNİVERSİTESİ';
UPDATE universitetler SET sehir = 'Trabzon'    WHERE ad = 'AVRASYA ÜNİVERSİTESİ';
UPDATE universitetler SET sehir = 'Bandırma'   WHERE ad = 'BANDIRMA ONYEDİ EYLÜL ÜNİVERSİTESİ';
UPDATE universitetler SET sehir = 'Bursa'      WHERE ad = 'MUDANYA ÜNİVERSİTESİ';
UPDATE universitetler SET sehir = 'Isparta'    WHERE ad = 'SÜLEYMAN DEMİREL ÜNİVERSİTESİ';
UPDATE universitetler SET sehir = 'Kayseri'    WHERE ad = 'NUH NACİ YAZGAN ÜNİVERSİTESİ';
UPDATE universitetler SET sehir = 'Erzurum'    WHERE ad = 'ATATÜRK ÜNİVERSİTESİ';
UPDATE universitetler SET sehir = 'Muş'        WHERE ad = 'MUŞ ALPARSLAN ÜNİVERSİTESİ';

-- ── KKTC üniversiteleri ─────────────────────────────────
UPDATE universitetler SET sehir = 'Girne' WHERE ad IN (
    'GİRNE AMERİKAN ÜNİVERSİTESİ',
    'GİRNE ÜNİVERSİTESİ'
);
UPDATE universitetler SET sehir = 'Gazimağusa' WHERE ad IN (
    'AKDENİZ KARPAZ ÜNİVERSİTESİ',
    'DOĞU AKDENİZ ÜNİVERSİTESİ'
);
UPDATE universitetler SET sehir = 'Lefke'      WHERE ad = 'LEFKE AVRUPA ÜNİVERSİTESİ';
UPDATE universitetler SET sehir = 'Lefkoşa'    WHERE ad IN (
    'ADA KENT ÜNİVERSİTESİ',
    'ARKIN YARATICI SANATLAR VE TASARIM ÜNİVERSİTESİ',
    'BAHÇEŞEHİR KIBRIS ÜNİVERSİTESİ',
    'KIBRIS AMERİKAN ÜNİVERSİTESİ',
    'KIBRIS AYDIN ÜNİVERSİTESİ',
    'KIBRIS BATI ÜNİVERSİTESİ',
    'KIBRIS SAĞLIK VE TOPLUM BİLİMLERİ ÜNİVERSİTESİ',
    'RAUF DENKTAŞ ÜNİVERSİTESİ',
    'ULUSLARARASI KIBRIS ÜNİVERSİTESİ',
    'ULUSLARARASI FİNAL ÜNİVERSİTESİ'
);

-- ── Yurt dışı üniversiteleri ────────────────────────────
UPDATE universitetler SET sehir = 'Bişkek'     WHERE ad = 'KIRGIZİSTAN-TÜRKİYE MANAS ÜNİVERSİTESİ';
UPDATE universitetler SET sehir = 'Türkistan'  WHERE ad = 'HOCA AHMET YESEVİ ULUSLARARASI TÜRK-KAZAK ÜNİVERSİTESİ';
UPDATE universitetler SET sehir = 'Bakü'       WHERE ad = 'AZERBAYCAN DEVLET PEDAGOJİ ÜNİVERSİTESİ';
UPDATE universitetler SET sehir = 'Saraybosna' WHERE ad = 'ULUSLARARASI SARAYBOSNA ÜNİVERSİTESİ';
UPDATE universitetler SET sehir = 'Üsküp'      WHERE ad = 'ULUSLARARASI BALKAN ÜNİVERSİTESİ';
UPDATE universitetler SET sehir = 'Tiran'      WHERE ad = 'TİRAN NEW YORK ÜNİVERSİTESİ';
