CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chatbot_documents (
    id BIGSERIAL PRIMARY KEY,
    source_key VARCHAR(120) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    source_type VARCHAR(40) NOT NULL,
    source_url VARCHAR(500),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chatbot_document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES chatbot_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_chatbot_documents_source_type
    ON chatbot_documents(source_type);

CREATE INDEX IF NOT EXISTS idx_chatbot_chunks_document_id
    ON chatbot_document_chunks(document_id);

INSERT INTO chatbot_documents (source_key, title, source_type, source_url, content)
VALUES
    ('site-universite', 'Üniversite Seç', 'site', '/universite', 'Üniversite Seç sayfası üniversite listesini, şehir bilgisini ve üniversite detaylarına geçişi sunar.'),
    ('site-programlar', 'Lisans Programı Seç', 'site', '/programlar', 'Lisans Programı Seç sayfası program adı, şehir, üniversite türü, puan türü, kontenjan, taban sıra ve taban puan filtreleriyle çalışır.'),
    ('site-tercih', 'Tercih Sihirbazı', 'site', '/tercih', 'Tercih Sihirbazı puan türü ve başarı sırasına göre programları CERTAIN, RISKY ve DIFFICULT gruplarına ayırır.'),
    ('site-netler', 'Net Sihirbazı', 'site', '/netler', 'Net Sihirbazı TYT neti, AYT neti, puan türü ve diploma notundan tahmini puan hesaplar.'),
    ('site-karsilastir', 'Karşılaştır', 'site', '/karsilastir', 'Karşılaştır sayfası seçilen üniversiteleri akademik göstergeler, akreditasyon, kampüs çevresi ve şehir maliyeti başlıklarıyla kıyaslar.'),
    ('site-listem', 'Listem', 'site', '/listem', 'Listem sayfası giriş yapan kullanıcıların tercih listelerini oluşturup saklamasını sağlar.')
ON CONFLICT (source_key) DO UPDATE
SET title = EXCLUDED.title,
    source_type = EXCLUDED.source_type,
    source_url = EXCLUDED.source_url,
    content = EXCLUDED.content,
    updated_at = NOW();

INSERT INTO chatbot_document_chunks (document_id, chunk_index, content)
SELECT id, 0, content
FROM chatbot_documents
WHERE source_key LIKE 'site-%'
ON CONFLICT (document_id, chunk_index) DO UPDATE
SET content = EXCLUDED.content;
