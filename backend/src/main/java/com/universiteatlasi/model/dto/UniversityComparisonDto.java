package com.universiteatlasi.model.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record UniversityComparisonDto(
    List<UniversityComparisonItemDto> items
) {
    public record UniversityComparisonItemDto(
        Long id,
        String name,
        String city,
        String type,
        Integer studentCount,
        Integer facultyCount,
        Integer bachelorProgramCount,
        Integer totalQuota,
        Integer totalPlaced,
        BigDecimal occupancyRate,
        Integer accreditedProgramCount,
        Integer accreditationTextCount,
        List<String> accreditationLabels,
        Map<String, Integer> campusPlaceCounts,
        Map<String, Integer> nearestCampusDistances,
        List<ComparisonMetricDto> accreditationMetrics,
        List<ComparisonMetricDto> academicMetrics,
        List<ComparisonMetricDto> satisfactionMetrics,
        CityQualityDto cityQuality,
        CityCostsDto cityCosts
    ) {}

    public record CityCostsDto(
        String sehir,
        BigDecimal cheapRestaurantMeal,
        BigDecimal utilities85m2,
        BigDecimal mobilePlan,
        BigDecimal internet60mbps,
        BigDecimal fitnessMonthly,
        BigDecimal cinemaTicket,
        BigDecimal rent1brCenter,
        BigDecimal rent1brOutside,
        BigDecimal rent3brCenter,
        BigDecimal rent3brOutside,
        BigDecimal avgMonthlySalary,
        BigDecimal mortgageRatePct,
        Boolean isSynthetic
    ) {}

    public record CityQualityDto(
        String sehir,
        BigDecimal qualityOfLifeIndex,
        BigDecimal purchasingPowerIndex,
        BigDecimal safetyIndex,
        BigDecimal healthCareIndex,
        BigDecimal climateIndex,
        BigDecimal costOfLivingIndex,
        BigDecimal propertyPriceToIncomeRatio,
        BigDecimal trafficCommuteTimeIndex,
        BigDecimal pollutionIndex
    ) {}

    public record ComparisonMetricDto(
        String category,
        String key,
        String label,
        BigDecimal numericValue,
        String textValue,
        String unit,
        String periodLabel,
        String sourceName
    ) {}
}
