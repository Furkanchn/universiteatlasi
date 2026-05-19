package com.universiteatlasi.model.dto;

import com.universiteatlasi.model.enums.TeachingType;
import com.universiteatlasi.model.enums.ScoreType;

/** Summary DTO for bachelor program listings */
public record BachelorProgramSummaryDto(
    Long id,
    String programName,
    String faculty,
    ScoreType scoreType,
    TeachingType teachingType,
    Integer quota,
    Integer scholarshipRate,
    String programCode,
    String language,
    Short educationDurationYears,
    String detailUrl,
    String programGroupName,
    String unitTypeName,
    String educationTypeName,
    String scholarshipRateName,
    UniversitySummaryDto university,
    YearDataDto latestYearData
) {}
