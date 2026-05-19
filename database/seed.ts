/**
 * Seed scripti — örnek veriyi veritabanına yükler.
 * Çalıştır: npx ts-node database/seed.ts
 *
 * Gerçek projede ÖSYM/YÖK verilerini buraya aktarın.
 * Veri kaynakları:
 *   - YÖK Lisans Atlası API (resmi JSON endpointleri)
 *   - ÖSYM kılavuz PDF → parse et
 *   - yokatlas.yok.gov.tr/content/2024/ statik JSON dosyaları
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed başlıyor...");

  // Örnek üniversiteler
  const universite1 = await prisma.universite.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      ad: "Orta Doğu Teknik Üniversitesi",
      sehir: "Ankara",
      bolge: "IC_ANADOLU",
      tur: "DEVLET",
      kurulumYili: 1956,
      websiteUrl: "https://www.metu.edu.tr",
      ogrenciSayisi: 28000,
      ogretimUyeSayisi: 1800,
    },
  });

  const universite2 = await prisma.universite.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      ad: "Boğaziçi Üniversitesi",
      sehir: "İstanbul",
      bolge: "MARMARA",
      tur: "DEVLET",
      kurulumYili: 1863,
      websiteUrl: "https://www.boun.edu.tr",
      ogrenciSayisi: 15000,
      ogretimUyeSayisi: 950,
    },
  });

  // Örnek lisans programı
  const program = await prisma.lisansProgram.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      universiteId: universite1.id,
      fakulte: "Mühendislik Fakültesi",
      programAdi: "Bilgisayar Mühendisliği",
      puanTuru: "SAY",
      ogretimTuru: "ORGUNLU",
      kontenjan: 150,
      bursOrani: 100,
    },
  });

  // Yıllık veri
  await prisma.lisansYilVerisi.upsert({
    where: { programId_yil: { programId: program.id, yil: 2024 } },
    update: {},
    create: {
      programId: program.id,
      yil: 2024,
      tabanPuan: 520.45,
      tabanSira: 1250,
      tavanPuan: 535.12,
      tavanSira: 450,
      yerlesen: 148,
      bosKalan: 2,
    },
  });

  console.log("✅ Seed tamamlandı");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
