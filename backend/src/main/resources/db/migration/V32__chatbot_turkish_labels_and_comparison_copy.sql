UPDATE chatbot_documents
SET content = 'Tercih Sihirbazı puan türü ve başarı sırasına göre programları Güçlü, Dengeli ve Zorlayıcı gruplarına ayırır.',
    updated_at = NOW()
WHERE source_key = 'site-tercih';

UPDATE chatbot_document_chunks c
SET content = d.content
FROM chatbot_documents d
WHERE c.document_id = d.id
  AND d.source_key = 'site-tercih';

UPDATE chatbot_documents
SET content = 'Karşılaştır sayfası seçilen üniversiteleri akademik göstergeler, akreditasyon, öğrenci deneyimi ve şehir maliyeti başlıklarıyla kıyaslar.',
    updated_at = NOW()
WHERE source_key = 'site-karsilastir';

UPDATE chatbot_document_chunks c
SET content = d.content
FROM chatbot_documents d
WHERE c.document_id = d.id
  AND d.source_key = 'site-karsilastir';
