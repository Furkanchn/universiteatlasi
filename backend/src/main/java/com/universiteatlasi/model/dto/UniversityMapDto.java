package com.universiteatlasi.model.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record UniversityMapDto(
    Long universityId,
    String universityName,
    BigDecimal lat,
    BigDecimal lng,
    String source,
    LocalDate sourceDate,
    String confidence,
    List<NearbyPlaceDto> places
) {
    public record NearbyPlaceDto(
        Long id,
        String name,
        String category,
        String subtype,
        BigDecimal lat,
        BigDecimal lng,
        Integer distanceMeters,
        String source,
        LocalDate sourceDate,
        String externalId
    ) {}
}
