# Harita Veri Hattı

Bu yapı üniversite konumları ve yakın çevre noktaları için sürdürülebilir bir veri akışı sağlar.

## Mevcut Durum

- Frontend, Konya pilotu için statik fallback veri kullanır.
- Backend tarafında `GET /api/university/{id}/map` endpointi hazırdır.
- Veritabanında `university_locations` ve `nearby_places` tabloları Flyway migration ile tanımlanmıştır.
- Henüz otomatik DB import çalıştırılmaz; önce preview üretip kontrol etmek gerekir.

## Preview Üretimi

```bash
node database/preview_osm_nearby_places.mjs
```

Script:
- OpenStreetMap/Overpass verisini okur.
- Kafe, yemek, yurt, market, ulaşım ve kütüphane kategorilerini işler.
- Üniversiteye kuş uçuşu mesafeyi hesaplar.
- Kategori bazında en yakın kayıtları JSON olarak stdout’a yazar.
- Veritabanına yazmaz.

## Onaydan Sonra Import

Onaydan sonra import adımı ayrı hazırlanmalıdır:
- JSON preview doğrulanır.
- `university_locations` tablosuna üniversite konumu yazılır.
- `nearby_places` tablosuna yakın yerler `source`, `source_date`, `external_id`, `distance_meters` ile yazılır.
- Duplicate kontrolü `university_id + source + external_id` üzerinden yapılır.

## Veri Kalitesi

OSM verisi sentetik değildir, ancak topluluk kaynaklıdır. Bir nokta gerçek dünyada var olduğu halde OSM’de eksik, yanlış veya farklı etiketlenmiş olabilir. Üretime genişletmeden önce pilot şehirler manuel kontrol edilmelidir.
## 10 Üniversite Pilot Genişletmesi

Konya pilotundan sonra ikinci kontrollü genişletme için aşağıdaki komutlar kullanılır:

```bash
node database/preview_osm_nearby_places.mjs --write
node database/import_major_university_map_data.mjs
```

Preview çıktısı `database/major_university_map_data.preview.json` dosyasına yazılır. Import scripti bu dosyayı okur ve ODTÜ, İTÜ, Ankara Üniversitesi, İstanbul Üniversitesi, Bilkent, Boğaziçi, Yıldız Teknik, Hacettepe, Gazi ve Marmara için onaylı pilot verisini `university_locations` ve `nearby_places` tablolarına yazar.

Çok kampüslü üniversitelerde bu pilot tek ana kampüs koordinatı kullanır:
- ODTÜ: Ana Kampüs
- İTÜ: Ayazağa
- Ankara Üniversitesi: Tandoğan
- İstanbul Üniversitesi: Beyazıt
- Bilkent: Merkez Kampüs
- Boğaziçi: Güney Kampüs
- Yıldız Teknik: Davutpaşa
- Hacettepe: Beytepe
- Gazi: Beşevler
- Marmara: Göztepe
## Grup Bazli Harita Hedefleri

Yeni harita genisletmeleri `database/map-targets/<group>.json` dosyalariyla yonetilir.

```bash
node database/preview_osm_nearby_places.mjs --group east --write
node database/import_map_data.mjs --group east
```

Preview ciktilari `database/map-previews/<group>.preview.json` altina yazilir. `east` grubu Dogu Anadolu ve Guneydogu Anadolu universiteleri icin bolgesel grup olarak kullanilir. Sirnak, Batman, Mardin Artuklu veya benzer bolge universiteleri eklenecekse `database/map-targets/east.json` icine yeni hedef kaydi eklenir ve ayni preview/import komutlari tekrar calistirilir.

Bir hedefte Nominatim yanlis kampus buluyorsa `useFallback: true` kullanilabilir. Bu durumda script `fallback.lat` ve `fallback.lng` koordinatlarini dogrudan kullanir.

## Tum Universiteler Icin OSM Hedef Listesi

Tum mevcut universiteler icin hedef listesi veritabanindan uretilebilir:

```bash
node database/generate_all_map_targets.mjs
node database/preview_osm_nearby_places.mjs --group all --write
```

Bu akista `database/map-targets/all.json` uretilir. Preview scripti her universite icin Nominatim ile koordinat arar, yakin cevre noktalarini Overpass uzerinden tek sorguda toplar ve `database/map-previews/all.preview.json` dosyasina yazar. Nominatim universite koordinati dondurmezse hedefteki `city` alaniyla sehir merkezi fallback koordinati denenir; hedefte `fallback` varsa dogrudan bu koordinat kullanilir.

OSM gecici hata verirse veya bir universite icin kategori sonucu bos kalirsa bos kayitlar yeniden denenebilir:

```bash
node database/preview_osm_nearby_places.mjs --group all --write --retry-empty
```

Preview dosyasi kontrol edildikten sonra import:

```bash
node database/import_map_data.mjs --group all
```

Not: Tum universiteler icin OSM sorgusu uzun surebilir ve dis ag erisimi gerektirir. Cok kampuslu universitelerde Nominatim'in sectigi ana konum elle kontrol edilmeli; gerekirse `database/map-targets/all.json` icinde ilgili hedefe `useFallback: true` ve dogrulanmis `fallback` koordinati eklenmelidir. OSM'de ilgili kategoriler yoksa lokasyon yine import edilir, yalniz `nearby_places` bos kalabilir.
