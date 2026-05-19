package com.universiteatlasi.model.dto;

/** University summary (used in program listings) */
public record UniversitySummaryDto(
    Long id,
    String name,
    String city,
    String type
) {}
