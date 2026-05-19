package com.universiteatlasi.model.dto;

/** Preference wizard match result */
public record PreferenceMatchDto(
    BachelorProgramSummaryDto program,
    String status,
    String reason
) {}
