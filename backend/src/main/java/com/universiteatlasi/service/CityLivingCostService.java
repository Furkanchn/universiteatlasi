package com.universiteatlasi.service;

import com.universiteatlasi.model.dto.CityLivingCostDto;
import com.universiteatlasi.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CityLivingCostService {

    private final JdbcTemplate jdbcTemplate;
    private final UniversityRepository universityRepository;

    public Optional<CityLivingCostDto> getByUniversityId(Long universityId) {
        return universityRepository.findById(universityId)
            .map(university -> university.getCity() == null ? null : university.getCity().trim())
            .filter(city -> !city.isBlank())
            .flatMap(this::getByCity);
    }

    public Optional<CityLivingCostDto> getByCity(String city) {
        if (city == null || city.trim().isBlank()) return Optional.empty();

        List<ProfileRow> profiles = jdbcTemplate.query(
            """
            SELECT id, city, period_label, currency, source_summary, source_date, confidence, notes
            FROM city_cost_profiles
            WHERE lower(city) = lower(?)
            """,
            (rs, rowNum) -> new ProfileRow(
                rs.getLong("id"),
                rs.getString("city"),
                rs.getString("period_label"),
                rs.getString("currency"),
                rs.getString("source_summary"),
                toLocalDate(rs.getDate("source_date")),
                rs.getString("confidence"),
                rs.getString("notes")
            ),
            city.trim()
        );

        if (profiles.isEmpty()) return Optional.empty();
        ProfileRow profile = profiles.get(0);
        List<CityLivingCostDto.CityCostItemDto> items = jdbcTemplate.query(
            """
            SELECT id, category, label, amount, unit, value_text, period_label, source,
                   source_url, source_date, confidence, sort_order
            FROM city_cost_items
            WHERE profile_id = ?
              AND category NOT IN ('electricity', 'natural_gas', 'water', 'utilities')
            ORDER BY sort_order ASC, id ASC
            """,
            (rs, rowNum) -> new CityLivingCostDto.CityCostItemDto(
                rs.getLong("id"),
                rs.getString("category"),
                rs.getString("label"),
                rs.getBigDecimal("amount"),
                rs.getString("unit"),
                rs.getString("value_text"),
                rs.getString("period_label"),
                rs.getString("source"),
                rs.getString("source_url"),
                toLocalDate(rs.getDate("source_date")),
                rs.getString("confidence"),
                rs.getInt("sort_order")
            ),
            profile.id()
        );

        if (items.stream().noneMatch(item -> item.amount() != null)) {
            return Optional.empty();
        }

        return Optional.of(new CityLivingCostDto(
            profile.id(),
            profile.city(),
            sanitizePeriodLabel(profile.periodLabel()),
            profile.currency(),
            sanitizeSourceSummary(profile.sourceSummary()),
            profile.sourceDate(),
            profile.confidence(),
            sanitizeNotes(profile.notes()),
            items
        ));
    }

    private static LocalDate toLocalDate(Date date) {
        return date == null ? null : date.toLocalDate();
    }

    private static String sanitizeSourceSummary(String value) {
        if (value == null || value.isBlank()) return value;
        String lower = value.toLowerCase();
        if (lower.contains("elektrik") || lower.contains("doğalgaz") || lower.contains("dogalgaz") || lower.contains("su")) {
            return "Şehir bazlı öğrenci yaşam maliyeti için kapsamlı ve karşılaştırılabilir kalemler gösterilir.";
        }
        return value;
    }

    private static String sanitizePeriodLabel(String value) {
        if (value == null || value.isBlank()) return value;
        return value.replace(" pilotu", " verisi").replace(" Pilotu", " Verisi");
    }

    private static String sanitizeNotes(String value) {
        if (value == null || value.isBlank()) return value;
        String lower = value.toLowerCase();
        if (lower.contains("elektrik") || lower.contains("doğalgaz") || lower.contains("dogalgaz") || lower.contains("su")) {
            return "Kapsamı tüm üniversiteler için tutarlı olmayan elektrik, doğalgaz ve su kalemleri bu panelde gösterilmez.";
        }
        return value;
    }

    private record ProfileRow(
        Long id,
        String city,
        String periodLabel,
        String currency,
        String sourceSummary,
        LocalDate sourceDate,
        String confidence,
        String notes
    ) {}
}
