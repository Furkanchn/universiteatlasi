package com.universiteatlasi.model.dto;

import java.math.BigDecimal;

/** Annual placement statistics */
public record YearDataDto(
    Integer year,
    BigDecimal baseScore,
    Integer    baseRank,
    BigDecimal ceilingScore,
    Integer    ceilingRank,
    Integer    placed,
    Integer    remaining,
    Integer    yearQuota,
    Integer    registered,
    Integer    additionalPlaced,
    Integer    additionalRegistered
) {}
