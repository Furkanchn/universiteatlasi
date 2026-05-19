package com.universiteatlasi.service;

import com.universiteatlasi.model.dto.BachelorFilterDto;
import com.universiteatlasi.model.dto.BachelorProgramSummaryDto;
import com.universiteatlasi.model.dto.ChatDto.*;
import com.universiteatlasi.model.dto.PagedResultDto;
import com.universiteatlasi.model.entity.University;
import com.universiteatlasi.model.enums.ScoreType;
import com.universiteatlasi.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);
    private static final int CONTEXT_LIMIT = 6;

    private final BachelorService bachelorService;
    private final UniversityRepository universityRepository;
    private final ChatKnowledgeService chatKnowledgeService;

    @Value("${app.chat.ollama.enabled:true}")
    private boolean ollamaEnabled;

    @Value("${app.chat.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${app.chat.ollama.model:qwen2.5:7b}")
    private String ollamaModel;

    public ChatResponse answer(ChatRequest request) {
        String sessionId = normalizeSessionId(request.sessionId());
        String message = request.message().trim();
        ChatIntent intent = classify(message);
        ChatContext context = buildContext(message, intent);

        String answer = callOllama(message, intent, context)
            .orElseGet(() -> fallbackAnswer(intent, context));

        return new ChatResponse(
            repairText(answer),
            repairSources(context.sources()),
            repairActions(suggestedActions(intent, context.hints(), message)),
            sessionId
        );
    }

    private ChatIntent classify(String message) {
        String text = normalizeText(message);
        if (containsAny(text, "nasil", "nerede", "site", "sayfa", "filtre", "liste", "kayit", "giris", "sihirbaz",
            "karsilastir", "maliyet", "yasam", "yemekhane", "yemek", "harita", "kampus", "akreditasyon",
            "numbeo", "yokak", "mudek", "tepdad", "ilad", "tuma", "yurt", "ulasim")) {
            return ChatIntent.SITE_SUPPORT;
        }
        if (containsAny(text, "puan", "sira", "siralama", "tercih", "universite", "program", "bolum", "kontenjan", "say", "ea", "soz", "dil")) {
            return ChatIntent.PREFERENCE_GUIDE;
        }
        return ChatIntent.GENERAL;
    }

    private ChatContext buildContext(String message, ChatIntent intent) {
        List<String> facts = new ArrayList<>();
        List<ChatSource> sources = new ArrayList<>();
        List<University> universities = universityRepository.findAllByOrderByNameAsc();
        QueryHints hints = extractHints(message, universities);

        if (intent == ChatIntent.SITE_SUPPORT || intent == ChatIntent.GENERAL) {
            facts.addAll(siteFacts(message));
            sources.add(new ChatSource("Site kullanım rehberi", "site", "/"));
        }

        chatKnowledgeService.retrieve(message).forEach(hit -> {
            facts.add(hit.content());
            sources.add(hit.source());
        });

        if (intent == ChatIntent.PREFERENCE_GUIDE || intent == ChatIntent.GENERAL) {
            facts.add("Sistemde " + universities.size() + " üniversite listeleniyor.");
            if (hints.hasAny()) facts.add("Algılanan tercih bağlamı: " + hints.describe());

            universities.stream()
                .filter(u -> messageMatches(message, u.getName()) || messageMatches(message, u.getCity()))
                .limit(3)
                .forEach(u -> {
                    facts.add("%s, %s ilinde yer alan %s türünde bir üniversitedir.".formatted(
                        u.getName(), safe(u.getCity()), u.getType().name()
                    ));
                    sources.add(new ChatSource(u.getName(), "university", "/universite/" + u.getId()));
                });

            PagedResultDto<BachelorProgramSummaryDto> programs = bachelorService.getPrograms(
                new BachelorFilterDto(
                    hints.searchTerm(),
                    hints.city(),
                    null,
                    null,
                    hints.scoreType(),
                    null,
                    null,
                    null,
                    hints.rank(),
                    null,
                    null,
                    null,
                    2025,
                    "baseRank_asc",
                    1,
                    CONTEXT_LIMIT
                )
            );

            if (programs.data().isEmpty() && hints.rank() != null) {
                programs = bachelorService.getPrograms(
                    new BachelorFilterDto(hints.searchTerm(), hints.city(), null, null, hints.scoreType(), null,
                        null, null, null, null, null, null, 2025, "baseRank_asc", 1, CONTEXT_LIMIT)
                );
                facts.add("Başarı sırası filtresiyle sonuç azaldığı için program adı, şehir ve puan türü bağlamıyla daha geniş sonuçlar da değerlendirildi.");
            }

            programs.data().forEach(program -> {
                facts.add("%s - %s: %s, kontenjan %s, taban sıra %s, taban puan %s.".formatted(
                    program.programName(),
                    program.university().name(),
                    program.scoreType(),
                    program.quota(),
                    program.latestYearData() == null ? "yok" : safe(program.latestYearData().baseRank()),
                    program.latestYearData() == null ? "yok" : safe(program.latestYearData().baseScore())
                ));
                sources.add(new ChatSource(program.programName(), "program", "/programlar/" + program.id()));
            });
        }

        if (facts.isEmpty()) {
            facts.add("Üniversite Atlası; üniversite, lisans programı, net hesaplama, tercih listesi ve karşılaştırma ekranları sunar.");
        }

        return new ChatContext(facts, dedupeSources(sources), hints);
    }

    private Optional<String> callOllama(String message, ChatIntent intent, ChatContext context) {
        if (!ollamaEnabled) return Optional.empty();
        try {
            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(Duration.ofSeconds(3));
            requestFactory.setReadTimeout(Duration.ofSeconds(25));
            RestClient client = RestClient.builder()
                .baseUrl(ollamaBaseUrl)
                .requestFactory(requestFactory)
                .build();

            Map<String, Object> body = Map.of(
                "model", ollamaModel,
                "stream", false,
                "prompt", prompt(message, intent, context)
            );
            @SuppressWarnings("unchecked")
            Map<String, Object> response = client.post()
                .uri("/api/generate")
                .body(body)
                .retrieve()
                .body(Map.class);

            Object text = response == null ? null : response.get("response");
            if (text == null || String.valueOf(text).isBlank()) return Optional.empty();
            return Optional.of(String.valueOf(text).trim());
        } catch (Exception ex) {
            log.warn("Ollama chat call failed: {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private String prompt(String message, ChatIntent intent, ChatContext context) {
        return """
            Sen Üniversite Atlası içinde çalışan kısa ve güvenilir bir tercih rehberi asistanısın.
            Sadece verilen bağlamı kullan. Veri yoksa uydurma; kullanıcıyı ilgili sayfaya yönlendir.
            Tercih kararlarında ÖSYM ve YÖK kaynaklarının esas olduğunu kısa biçimde hatırlat.
            Niyet: %s
            Algılanan bağlam: %s
            Bağlam maddeleri:
            - %s
            Kullanıcı mesajı: %s
            Yanıtı Türkçe, kısa ve uygulanabilir yaz.
            """.formatted(intent, context.hints().describe(), String.join("\n- ", context.facts()), message);
    }

    private String fallbackAnswer(ChatIntent intent, ChatContext context) {
        if (intent == ChatIntent.SITE_SUPPORT) {
            String facts = context.facts().stream().limit(4).collect(Collectors.joining(" "));
            return facts + " İlgili veriyi görmek için önerilen sayfayı açabilir, üniversite veya program adını da mesajına ekleyebilirsin.";
        }
        if (intent == ChatIntent.PREFERENCE_GUIDE) {
            String facts = context.facts().stream().limit(6).collect(Collectors.joining(" "));
            return facts + " Daha net öneri için puan türü, şehir, bölüm adı ve başarı sıranı birlikte yaz. Resmi tercih kararında ÖSYM ve YÖK kaynakları esas alınmalıdır.";
        }
        return "Üniversite, bölüm, şehir, başarı sırası veya site kullanımı hakkında soru sorabilirsin. Örneğin: 'SAY 50000 sıralamayla Ankara bilgisayar mühendisliği için seçenekler neler?'";
    }

    private List<ChatAction> suggestedActions(ChatIntent intent, QueryHints hints, String message) {
        if (intent == ChatIntent.PREFERENCE_GUIDE) {
            String query = programQueryPath(hints);
            return List.of(
                new ChatAction("Programları aç", query),
                new ChatAction("Tercih sihirbazı", "/tercih"),
                new ChatAction("Karşılaştır", "/karsilastir")
            );
        }
        String normalized = normalizeText(message);
        if (containsAny(normalized, "karsilastir", "akademik", "akreditasyon", "kampus", "tuma", "numbeo", "maliyet", "yasam")) {
            return List.of(
                new ChatAction("Karşılaştır", "/karsilastir"),
                new ChatAction("Üniversiteler", "/universite"),
                new ChatAction("Programlar", "/programlar")
            );
        }
        if (containsAny(normalized, "yemekhane", "yemek", "harita", "yurt", "ulasim", "kampus")) {
            return List.of(
                new ChatAction("Üniversiteler", "/universite"),
                new ChatAction("Karşılaştır", "/karsilastir"),
                new ChatAction("Programlar", "/programlar")
            );
        }
        if (containsAny(normalized, "net", "tyt", "ayt", "puan hesap")) {
            return List.of(
                new ChatAction("Net sihirbazı", "/netler"),
                new ChatAction("Tercih sihirbazı", "/tercih"),
                new ChatAction("Programlar", "/programlar")
            );
        }
        if (containsAny(normalized, "liste", "kaydet", "giris", "hesap")) {
            return List.of(
                new ChatAction("Listem", "/listem"),
                new ChatAction("Giriş", "/giris"),
                new ChatAction("Kayıt ol", "/kayit")
            );
        }
        return List.of(
            new ChatAction("Üniversiteler", "/universite"),
            new ChatAction("Programlar", "/programlar"),
            new ChatAction("Karşılaştır", "/karsilastir"),
            new ChatAction("Net sihirbazı", "/netler"),
            new ChatAction("Listem", "/listem")
        );
    }

    private String programQueryPath(QueryHints hints) {
        List<String> params = new ArrayList<>();
        if (!hints.searchTerm().isBlank()) params.add("search=" + encodeQuery(hints.searchTerm()));
        if (hints.city() != null) params.add("city=" + encodeQuery(hints.city()));
        if (hints.scoreType() != null) params.add("scoreType=" + hints.scoreType().name());
        if (hints.rank() != null) params.add("minRank=" + hints.rank());
        return params.isEmpty() ? "/programlar" : "/programlar?" + String.join("&", params);
    }

    private QueryHints extractHints(String message, List<University> universities) {
        String searchTerm = bestProgramSearch(message);
        ScoreType scoreType = extractScoreType(message);
        Integer rank = extractRank(message);
        String city = extractCity(message, universities);
        return new QueryHints(searchTerm, city, scoreType, rank);
    }

    private ScoreType extractScoreType(String message) {
        String normalized = " " + normalizeText(message) + " ";
        if (normalized.contains(" say ")) return ScoreType.SAY;
        if (normalized.contains(" ea ")) return ScoreType.EA;
        if (normalized.contains(" soz ") || normalized.contains(" sozel ")) return ScoreType.SOZ;
        if (normalized.contains(" dil ")) return ScoreType.DIL;
        if (normalized.contains(" tyt ")) return ScoreType.TYT;
        return null;
    }

    private Integer extractRank(String message) {
        String normalized = normalizeText(message);
        var binMatcher = java.util.regex.Pattern.compile("\\b(\\d{1,4})\\s*bin\\b").matcher(normalized);
        if (binMatcher.find()) {
            int value = Integer.parseInt(binMatcher.group(1)) * 1000;
            if (value >= 100 && value <= 3_000_000) return value;
        }

        normalized = normalized.replace(".", "").replace(",", "");
        var matcher = java.util.regex.Pattern.compile("\\b\\d{3,7}\\b").matcher(normalized);
        while (matcher.find()) {
            int value = Integer.parseInt(matcher.group());
            if (value >= 100 && value <= 3_000_000) return value;
        }
        return null;
    }

    private String extractCity(String message, List<University> universities) {
        String normalized = normalizeText(message);
        return universities.stream()
            .map(University::getCity)
            .filter(Objects::nonNull)
            .distinct()
            .filter(city -> normalized.contains(normalizeText(city)))
            .findFirst()
            .orElse(null);
    }

    private List<String> siteFacts(String message) {
        String normalized = normalizeText(message);
        List<SiteFact> facts = List.of(
            new SiteFact("Üniversiteler sayfası üniversite listesi ve detaylarına gider; detay sayfasında lisans özeti, programlar, doluluk ve puan türü dağılımı bulunur.", List.of("universite", "detay", "doluluk", "dagilim")),
            new SiteFact("Programlar sayfası program, şehir, üniversite türü, öğretim türü, puan türü, kontenjan, taban puan ve taban sıra filtreleri sunar.", List.of("program", "filtre", "kontenjan", "taban", "puan", "sira", "sehir")),
            new SiteFact("Tercih Sihirbazı başarı sırası ve puan türüne göre program eşleştirmesi yapar; aday kendi sırasını ve hedef bölümünü birlikte yazarsa daha net yönlendirme alır.", List.of("tercih", "sihirbaz", "basari", "siralama")),
            new SiteFact("Net Sihirbazı TYT/AYT netleri ve diploma notundan tahmini puan hesaplar; sonuç resmi ÖSYM puanı yerine karar destek çıktısıdır.", List.of("net", "tyt", "ayt", "puan hesap", "diploma")),
            new SiteFact("Karşılaştır sayfası seçilen üniversiteleri program, kontenjan, doluluk, akademik görünürlük, akreditasyon, kampüs çevresi, öğrenci deneyimi, şehir ve maliyet başlıklarında yan yana inceler.", List.of("karsilastir", "akademik", "akreditasyon", "kampus", "ogrenci", "maliyet", "numbeo", "tuma")),
            new SiteFact("Üniversite detayındaki harita paneli kampüs çevresindeki yurt, ulaşım, kütüphane, market, kafe ve yeme içme noktalarını gösterir.", List.of("harita", "kampus", "yurt", "ulasim", "kutuphane", "market", "kafe")),
            new SiteFact("Yaşam maliyeti paneli şehir bazlı resmi ulaşım ve temel gider kalemlerini; karşılaştırma ekranı Numbeo 2025 şehir maliyet ve yaşam kalitesi endekslerini gösterir.", List.of("yasam", "maliyet", "ulasim", "numbeo", "sehir")),
            new SiteFact("Yemekhane ücretleri yalnızca üniversitenin resmi SKS veya yemekhane kaynağında açık ücret bulunduğunda üniversite detay sayfasında gösterilir.", List.of("yemekhane", "yemek", "sks", "ucret")),
            new SiteFact("Akreditasyon alanları YÖK Atlas program etiketleri ile YÖKAK, TEPDAD, MÜDEK ve İLAD/İLEDAK gibi mevcut metriklerden beslenir.", List.of("akreditasyon", "yokak", "tepdad", "mudek", "ilad", "iledak", "yok atlas")),
            new SiteFact("Listem sayfası giriş yapan kullanıcıların tercih listelerini saklar; giriş ve kayıt ekranları hesap işlemleri için kullanılır.", List.of("liste", "listem", "kaydet", "giris", "kayit", "hesap"))
        );
        List<String> matched = facts.stream()
            .filter(fact -> fact.keywords().stream().anyMatch(normalized::contains))
            .map(SiteFact::text)
            .toList();
        return matched.isEmpty() ? facts.stream().map(SiteFact::text).toList() : matched;
    }

    private String cleanSearch(String message) {
        return message.replaceAll("[^\\p{L}\\p{N}\\s]", " ")
            .replaceAll("\\s+", " ")
            .trim();
    }

    private String bestProgramSearch(String message) {
        String normalizedMessage = normalizeText(message);
        return bachelorService.getProgramNames().stream()
            .filter(name -> normalizedMessage.contains(normalizeText(name)))
            .findFirst()
            .orElseGet(() -> cleanSearch(message));
    }

    private String normalizeText(String value) {
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

    private boolean messageMatches(String message, String value) {
        if (value == null || value.isBlank()) return false;
        return normalizeText(message).contains(normalizeText(value));
    }

    private boolean containsAny(String text, String... needles) {
        return Arrays.stream(needles).anyMatch(text::contains);
    }

    private String normalizeSessionId(String sessionId) {
        return sessionId == null || sessionId.isBlank() ? UUID.randomUUID().toString() : sessionId;
    }

    private List<ChatSource> dedupeSources(List<ChatSource> sources) {
        Map<String, ChatSource> result = new LinkedHashMap<>();
        sources.forEach(source -> result.putIfAbsent(source.type() + ":" + source.url(), source));
        return new ArrayList<>(result.values());
    }

    private String encodeQuery(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String safe(Object value) {
        return value == null ? "yok" : String.valueOf(value);
    }

    private List<ChatSource> repairSources(List<ChatSource> sources) {
        return sources.stream()
            .map(source -> new ChatSource(repairText(source.label()), source.type(), source.url()))
            .toList();
    }

    private List<ChatAction> repairActions(List<ChatAction> actions) {
        return actions.stream()
            .map(action -> new ChatAction(repairText(action.label()), action.path()))
            .toList();
    }

    private String repairText(String value) {
        if (value == null || !looksMojibake(value)) return value;
        try {
            return new String(value.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);
        } catch (Exception ignored) {
            return value;
        }
    }

    private boolean looksMojibake(String value) {
        return value.contains("Ã") || value.contains("Ä") || value.contains("Å") || value.contains("Â") || value.contains("â");
    }

    private enum ChatIntent {
        PREFERENCE_GUIDE,
        SITE_SUPPORT,
        GENERAL
    }

    private record ChatContext(List<String> facts, List<ChatSource> sources, QueryHints hints) {}

    private record SiteFact(String text, List<String> keywords) {}

    private record QueryHints(String searchTerm, String city, ScoreType scoreType, Integer rank) {
        boolean hasAny() {
            return !searchTerm.isBlank() || city != null || scoreType != null || rank != null;
        }

        String describe() {
            List<String> parts = new ArrayList<>();
            if (!searchTerm.isBlank()) parts.add("program araması: " + searchTerm);
            if (city != null) parts.add("şehir: " + city);
            if (scoreType != null) parts.add("puan türü: " + scoreType);
            if (rank != null) parts.add("başarı sırası: " + rank);
            return parts.isEmpty() ? "belirtilmedi" : String.join(", ", parts);
        }
    }
}
