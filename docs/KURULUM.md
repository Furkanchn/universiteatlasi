# Kurulum

## Gereksinimler

| Araç | Sürüm |
| --- | --- |
| Docker Desktop | Güncel |
| Java JDK | 17+ |
| Maven | 3.8+ |
| Node.js | 18+ |
| Python | 3.10+ |

## Altyapıyı Başlat

```powershell
cd "C:\Users\Yusuf\Desktop\universiteatlasi"
docker compose up -d
docker compose ps
```

PostgreSQL ve Redis ayakta olmalı.

## Backend

```powershell
cd "C:\Users\Yusuf\Desktop\universiteatlasi\backend"
mvn spring-boot:run
```

Backend `http://127.0.0.1:8080` üzerinde çalışır. Flyway migration'ları uygulama açılışında doğrulanır.

## Frontend

```powershell
cd "C:\Users\Yusuf\Desktop\universiteatlasi\frontend"
npm install
npm run dev
```

Frontend `http://127.0.0.1:5173` üzerinde çalışır.

## Veri Aktarma

Lisans veri aktarımı için:

```powershell
$env:YOKATLAS_IMPORT_MODE="snapshot"
$env:YOKATLAS_MAX_PAGES_PER_SCORE="1"
node database/import_yokatlas_api.mjs
```

Bu komut PostgreSQL'e yazmaz; küçük bir YÖK Atlas snapshot dosyası üretir. Tam snapshot için `YOKATLAS_MAX_PAGES_PER_SCORE` değişkenini kaldırın.

Doğrulanmış snapshot'ı veritabanına kullanıcı/tercih verilerini silmeden upsert etmek için:

```powershell
$env:YOKATLAS_IMPORT_MODE="import"
$env:YOKATLAS_IMPORT_APPROVED="true"
$env:YOKATLAS_SNAPSHOT_PATH="database/snapshots/yokatlas-lisans-....json"
node database/import_yokatlas_api.mjs
```

Import modu üniversite, lisans programı ve yıllık veri tablolarını snapshot ile güncellemek için kullanılır. Kullanıcı ve tercih listesi tabloları silinmez. Korunması gereken veritabanında çalıştırmadan önce mutlaka yedek alın. Onay değişkeni verilmezse script veritabanına yazmadan durur.

Eski JSON/Excel tabanlı bakım script'i korunmuştur, ancak güncel genişletilmiş alanlar için birincil yol `database/import_yokatlas_api.mjs` olmalıdır.

## Doğrulama

```sql
SELECT COUNT(*) FROM universitetler;
SELECT COUNT(*) FROM lisans_programlari;
SELECT COUNT(*) FROM lisans_yil_verileri;
```

Veri kalite kontrolleri için:

```powershell
psql "postgresql://postgres:postgres@localhost:5432/universiteatlasi" `
  -f database/data_quality_checks.sql
```

## Sık Kullanılan Kontroller

```powershell
cd backend
mvn test
```

```powershell
cd frontend
npm run build
```



