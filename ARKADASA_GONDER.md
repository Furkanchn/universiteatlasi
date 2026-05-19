# Arkadasa Gonderme ve Calistirma

Bu paket, projeyi Yusuf'un bilgisayarindaki haliyle ayni verilerle calistirmak icin hazirlanmistir.

Paket icindeki hazir snapshot ile kurulum yapildiginda Kibris ve yurt disi universiteleri projeye alinmaz.

## Gerekenler

Arkadasinin bilgisayarinda bunlar kurulu olmali:

- Docker Desktop
- Java JDK 17 veya daha yeni
- Maven 3.8 veya daha yeni
- Node.js 18 veya daha yeni

Kontrol komutlari:

```powershell
docker --version
java -version
mvn -version
node -v
npm -v
```

`mvn` taninmiyorsa Maven PATH'e eklenmemistir. Maven kurulduktan sonra yeni PowerShell penceresi acilmali.

## 1. Zip'i Ac

Zip'i masaustune veya istedigin bir klasore ac.

Ornek proje yolu:

```powershell
C:\Users\Kullanici\Desktop\universiteatlasi-arkadasa-gonder
```

PowerShell'i proje kok dizininde ac:

```powershell
cd "C:\Users\Kullanici\Desktop\universiteatlasi-arkadasa-gonder"
```

## 2. Temiz Docker Veritabani Baslat

Docker Desktop acik olmali.

Eger bu proje ilk kez kuruluyorsa:

```powershell
docker compose up -d
```

Ayni bilgisayarda daha once bu proje denendiyse temiz baslamak icin once sunu calistir:

```powershell
docker compose down -v
docker compose up -d
```

## 3. Backend'i Baslat

Yeni bir PowerShell penceresinde:

```powershell
cd "C:\Users\Kullanici\Desktop\universiteatlasi-arkadasa-gonder\backend"
mvn spring-boot:run
```

Backend acikken bu pencereyi kapatma.

Backend basarili calisirsa su adres acilir:

```text
http://127.0.0.1:8080
```

Swagger:

```text
http://127.0.0.1:8080/swagger-ui/index.html
```

## 4. Lisans Verisini Iceri Aktar

Backend calisirken ikinci bir PowerShell penceresi ac.

Proje kok dizinine git:

```powershell
cd "C:\Users\Kullanici\Desktop\universiteatlasi-arkadasa-gonder"
```

Hazir YOK Atlas snapshot'ini PostgreSQL'e aktar:

```powershell
$env:YOKATLAS_IMPORT_MODE="import"
$env:YOKATLAS_IMPORT_APPROVED="true"
$env:YOKATLAS_SNAPSHOT_PATH="database/snapshots/yokatlas-lisans-2026-05-15T12-38-24.050Z.json"
node database/import_yokatlas_api.mjs
```

Basarili olunca buna benzer bir sonuc gorulur:

```text
Prepared non-destructive upsert plan: 201 universities, 11245 imported programs
Upserted and validated 11245 programs into Docker PostgreSQL
```

## 5. Frontend'i Baslat

Ucuncu bir PowerShell penceresi ac:

```powershell
cd "C:\Users\Kullanici\Desktop\universiteatlasi-arkadasa-gonder\frontend"
npm install
npm run dev
```

Frontend adresi:

```text
http://127.0.0.1:5173
```

## 6. Kontrol Listesi

Tarayicida sunu ac:

```text
http://127.0.0.1:5173
```

Beklenenler:

- Universite ve program listeleri dolu gelir.
- Sehir filtresinde KIBRIS veya YURT DISI secenegi yoktur.
- Net Sihirbazi'nda soru sayisindan fazla dogru/yanlis girilirse hata gosterilir.
- Backend saglik kontrolu 200 doner:

```text
http://127.0.0.1:8080/actuator/health
```

## Sorun Cozme

### Frontend bos gorunurse

Backend'in calistigindan emin ol:

```text
http://127.0.0.1:8080/actuator/health
```

Sonra 4. adimdaki import komutunu tekrar calistir.

### 8080 portu doluysa

8080'i kullanan eski uygulamayi kapat veya bilgisayari yeniden baslat.

### 5173 portu doluysa

Vite baska port onerebilir. Terminalde yazan yerel adresi ac.

### Docker hatasi alinirsa

Docker Desktop'in tamamen acildigindan emin ol. Sonra:

```powershell
docker compose ps
```

PostgreSQL ve Redis `Up` durumunda olmali.

## Paket Notlari

Zip icinde sunlar yoktur; kurulumda yeniden uretilir:

- `.git`
- `.idea`
- `.vscode`
- `frontend/node_modules`
- `frontend/dist`
- `backend/target`
- calisma loglari

Bu sayede zip daha temiz kalir. Kurulumda `npm install` ve `mvn spring-boot:run` gerekli dosyalari yeniden olusturur.
