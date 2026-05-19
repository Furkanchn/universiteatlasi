package com.universiteatlasi.model.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UniversityMealCostDto(
    Long universityId,
    String universityName,
    List<MealCostItemDto> items
) {
    public record MealCostItemDto(
        Long id,
        String mealType,
        String label,
        BigDecimal amount,
        String unit,
        String periodLabel,
        String source,
        String sourceUrl,
        LocalDate sourceDate,
        String confidence,
        Integer sortOrder
    ) {}
}
