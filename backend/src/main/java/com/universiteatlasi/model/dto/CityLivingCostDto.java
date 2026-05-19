package com.universiteatlasi.model.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CityLivingCostDto(
    Long id,
    String city,
    String periodLabel,
    String currency,
    String sourceSummary,
    LocalDate sourceDate,
    String confidence,
    String notes,
    List<CityCostItemDto> items
) {
    public record CityCostItemDto(
        Long id,
        String category,
        String label,
        BigDecimal amount,
        String unit,
        String valueText,
        String periodLabel,
        String source,
        String sourceUrl,
        LocalDate sourceDate,
        String confidence,
        Integer sortOrder
    ) {}
}
