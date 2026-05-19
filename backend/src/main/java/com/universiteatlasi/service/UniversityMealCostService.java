package com.universiteatlasi.service;

import com.universiteatlasi.model.dto.UniversityMealCostDto;
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
public class UniversityMealCostService {

    private final JdbcTemplate jdbcTemplate;
    private final UniversityRepository universityRepository;

    public Optional<UniversityMealCostDto> getByUniversityId(Long universityId) {
        return universityRepository.findById(universityId).flatMap(university -> {
            List<UniversityMealCostDto.MealCostItemDto> items = jdbcTemplate.query(
                """
                SELECT id, meal_type, label, amount, unit, period_label, source,
                       source_url, source_date, confidence, sort_order
                FROM university_meal_costs
                WHERE university_id = ?
                ORDER BY sort_order ASC, id ASC
                """,
                (rs, rowNum) -> new UniversityMealCostDto.MealCostItemDto(
                    rs.getLong("id"),
                    rs.getString("meal_type"),
                    rs.getString("label"),
                    rs.getBigDecimal("amount"),
                    rs.getString("unit"),
                    rs.getString("period_label"),
                    rs.getString("source"),
                    rs.getString("source_url"),
                    toLocalDate(rs.getDate("source_date")),
                    rs.getString("confidence"),
                    rs.getInt("sort_order")
                ),
                universityId
            );
            if (items.isEmpty()) return Optional.empty();
            return Optional.of(new UniversityMealCostDto(university.getId(), university.getName(), items));
        });
    }

    private static LocalDate toLocalDate(Date date) {
        return date == null ? null : date.toLocalDate();
    }
}
