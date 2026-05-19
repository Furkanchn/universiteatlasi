UPDATE city_cost_items
SET
    category = 'source_note',
    label = 'Konut ve kira resmi veri kaynağı',
    value_text = 'Şehir bazlı kira tutarı değildir; TCMB konut/kira endeksleri resmi gösterge olarak takip edilir.',
    updated_at = NOW()
WHERE category = 'housing'
  AND amount IS NULL;

UPDATE city_cost_items
SET
    category = 'source_note',
    label = 'TÜİK fiyat istatistikleri notu',
    value_text = 'TÜİK fiyat endeksleri resmi istatistiktir; tek başına öğrenci yaşam maliyeti veya şehir harcama sepeti değildir.',
    updated_at = NOW()
WHERE category = 'general_index'
  AND amount IS NULL;

UPDATE city_cost_profiles
SET
    source_summary = 'Sayısal kartlar resmi ulaşım tarifelerinden gelir; TÜİK ve TCMB bağlantıları metodoloji/kaynak notu olarak gösterilir.',
    notes = 'Bu pilot sürümde yalnızca resmi kurumların yayımladığı sayısal kalemler maliyet kartı olarak gösterilir. TÜİK ve TCMB kayıtları doğrudan kira/market tutarı üretmediği için kart değil kaynak notudur.',
    updated_at = NOW()
WHERE city IN ('Ankara', 'İstanbul', 'İzmir', 'Antalya', 'Bursa', 'Konya');
