package com.universiteatlasi.service;

import com.universiteatlasi.model.dto.ChatDto.ChatSource;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.text.Normalizer;
import java.time.Duration;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatKnowledgeService {

    private static final Logger log = LoggerFactory.getLogger(ChatKnowledgeService.class);

    private final JdbcTemplate jdbcTemplate;

    @Value("${app.chat.ollama.enabled:true}")
    private boolean ollamaEnabled;

    @Value("${app.chat.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${app.chat.ollama.embedding-model:nomic-embed-text}")
    private String embeddingModel;

    public List<KnowledgeHit> retrieve(String message) {
        List<KnowledgeHit> dbHits = retrieveFromDatabase(message);
        if (!dbHits.isEmpty()) return dbHits;
        return retrieveFromDefaults(message);
    }

    private List<KnowledgeHit> retrieveFromDatabase(String message) {
        if (!hasKnowledgeTables()) return List.of();

        Optional<String> embedding = embeddingFor(message);
        if (embedding.isPresent()) {
            try {
                return jdbcTemplate.query("""
                    SELECT d.title, d.source_type, d.source_url, c.content
                    FROM chatbot_document_chunks c
                    JOIN chatbot_documents d ON d.id = c.document_id
                    WHERE c.embedding IS NOT NULL
                    ORDER BY c.embedding <-> ?::vector
                    LIMIT 4
                    """,
                    (rs, rowNum) -> new KnowledgeHit(
                        rs.getString("content"),
                        new ChatSource(rs.getString("title"), rs.getString("source_type"), rs.getString("source_url"))
                    ),
                    embedding.get()
                );
            } catch (Exception ex) {
                log.debug("Vector retrieval unavailable: {}", ex.getMessage());
            }
        }

        return retrieveByKeyword(message);
    }

    private List<KnowledgeHit> retrieveByKeyword(String message) {
        String normalized = normalize(message);
        if (normalized.isBlank()) return List.of();

        try {
            List<KnowledgeHit> broadHits = jdbcTemplate.query("""
                SELECT d.title, d.source_type, d.source_url, c.content
                FROM chatbot_document_chunks c
                JOIN chatbot_documents d ON d.id = c.document_id
                ORDER BY d.source_type, c.chunk_index
                LIMIT 25
                """,
                (rs, rowNum) -> new KnowledgeHit(
                    rs.getString("content"),
                    new ChatSource(rs.getString("title"), rs.getString("source_type"), rs.getString("source_url"))
                )
            );

            return broadHits.stream()
                .filter(hit -> normalize(hit.content()).contains(normalized)
                    || normalized.contains(normalize(hit.source().label()))
                    || tokenOverlap(normalized, normalize(hit.content())) >= 2)
                .limit(4)
                .toList();
        } catch (Exception ex) {
            log.debug("Keyword retrieval unavailable: {}", ex.getMessage());
            return List.of();
        }
    }

    private boolean hasKnowledgeTables() {
        try {
            Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name IN ('chatbot_documents', 'chatbot_document_chunks')
                """, Integer.class);
            return count != null && count == 2;
        } catch (Exception ex) {
            return false;
        }
    }

    private Optional<String> embeddingFor(String text) {
        if (!ollamaEnabled) return Optional.empty();
        try {
            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(Duration.ofSeconds(3));
            requestFactory.setReadTimeout(Duration.ofSeconds(15));
            RestClient client = RestClient.builder()
                .baseUrl(ollamaBaseUrl)
                .requestFactory(requestFactory)
                .build();

            Map<String, Object> body = Map.of("model", embeddingModel, "prompt", text);
            @SuppressWarnings("unchecked")
            Map<String, Object> response = client.post()
                .uri("/api/embeddings")
                .body(body)
                .retrieve()
                .body(Map.class);

            Object rawEmbedding = response == null ? null : response.get("embedding");
            if (!(rawEmbedding instanceof List<?> values) || values.isEmpty()) return Optional.empty();
            return Optional.of(vectorLiteral(values));
        } catch (Exception ex) {
            log.debug("Ollama embedding unavailable: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private String vectorLiteral(List<?> values) {
        StringBuilder builder = new StringBuilder("[");
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) builder.append(',');
            builder.append(values.get(i));
        }
        return builder.append(']').toString();
    }

    private List<KnowledgeHit> retrieveFromDefaults(String message) {
        String normalized = normalize(message);
        return defaultDocuments().stream()
            .filter(item -> normalize(item.content()).contains(normalized)
                || normalized.contains(normalize(item.source().label()))
                || tokenOverlap(normalized, normalize(item.content())) >= 2)
            .limit(4)
            .toList();
    }

    private long tokenOverlap(String left, String right) {
        Set<String> rightTokens = new HashSet<>(Arrays.asList(right.split("\\s+")));
        return Arrays.stream(left.split("\\s+"))
            .filter(token -> token.length() > 3)
            .filter(rightTokens::contains)
            .count();
    }

    private String normalize(String value) {
        String lower = value.toLowerCase(Locale.forLanguageTag("tr"))
            .replace('ı', 'i')
            .replace('ğ', 'g')
            .replace('ü', 'u')
            .replace('ş', 's')
            .replace('ö', 'o')
            .replace('ç', 'c');
        return Normalizer.normalize(lower, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .replaceAll("[^a-z0-9\\s]", " ")
            .replaceAll("\\s+", " ")
            .trim();
    }

    private List<KnowledgeHit> defaultDocuments() {
        return List.of(
            new KnowledgeHit("Üniversiteler sayfası üniversite listesini, şehir bilgisini ve üniversite detaylarına geçişi sunar.", new ChatSource("Üniversiteler", "site", "/universite")),
            new KnowledgeHit("Programlar sayfası program adı, şehir, üniversite türü, puan türü, kontenjan, taban sıra ve taban puan filtreleriyle çalışır.", new ChatSource("Programlar", "site", "/programlar")),
            new KnowledgeHit("Tercih Sihirbazı puan türü ve başarı sırasına göre programları Güçlü, Dengeli ve Zorlayıcı gruplarına ayırır.", new ChatSource("Tercih Sihirbazı", "site", "/tercih")),
            new KnowledgeHit("Net Sihirbazı TYT neti, AYT neti, puan türü ve diploma notundan tahmini puan hesaplar.", new ChatSource("Net Sihirbazı", "site", "/netler")),
            new KnowledgeHit("Karşılaştır sayfası seçilen üniversiteleri akademik göstergeler, akreditasyon, kampüs çevresi ve şehir maliyeti başlıklarıyla kıyaslar.", new ChatSource("Karşılaştır", "site", "/karsilastir")),
            new KnowledgeHit("Listem sayfası giriş yapan kullanıcıların tercih listelerini oluşturup saklamasını sağlar.", new ChatSource("Listem", "site", "/listem"))
        );
    }

    public record KnowledgeHit(String content, ChatSource source) {}
}
