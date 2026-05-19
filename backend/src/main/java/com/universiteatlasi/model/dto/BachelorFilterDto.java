package com.universiteatlasi.model.dto;

import com.universiteatlasi.model.enums.ScoreType;
import com.universiteatlasi.model.enums.TeachingType;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;
import java.util.Set;

/** Filter and pagination request for the 2025 bachelor program list. */
public record BachelorFilterDto(
    String search,
    String city,
    Long universityId,
    String universityType,
    ScoreType scoreType,
    TeachingType teachingType,
    @Min(0) Integer minQuota,
    @Min(0) Integer maxQuota,
    @Min(0) Integer minRank,
    @Min(0) Integer maxRank,
    @DecimalMin("0.0") BigDecimal minBaseScore,
    @DecimalMin("0.0") BigDecimal maxBaseScore,
    @Min(2025) @Max(2025) Integer year,
    String sort,
    @Min(1) Integer page,
    @Min(1) @Max(100) Integer limit
) {
    private static final Set<String> ALLOWED_SORTS = Set.of(
        "baseRank_asc",
        "baseRank_desc",
        "quota_asc",
        "quota_desc",
        "programName_asc",
        "programName_desc"
    );

    public BachelorFilterDto {
        year = 2025;
        if (sort == null || !ALLOWED_SORTS.contains(sort)) sort = "baseRank_asc";
        if (page == null || page < 1) page = 1;
        if (limit == null || limit < 1) limit = 20;
        if (limit > 100) limit = 100;
    }

    @AssertTrue(message = "Minimum quota cannot be greater than maximum quota")
    public boolean isQuotaRangeValid() {
        return minQuota == null || maxQuota == null || minQuota <= maxQuota;
    }

    @AssertTrue(message = "Minimum base rank cannot be greater than maximum base rank")
    public boolean isBaseRankRangeValid() {
        return minRank == null || maxRank == null || minRank <= maxRank;
    }

    @AssertTrue(message = "Minimum base score cannot be greater than maximum base score")
    public boolean isBaseScoreRangeValid() {
        return minBaseScore == null || maxBaseScore == null || minBaseScore.compareTo(maxBaseScore) <= 0;
    }
}
