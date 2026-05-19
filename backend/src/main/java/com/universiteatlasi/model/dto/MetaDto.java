package com.universiteatlasi.model.dto;

public record MetaDto(
    long total,
    int page,
    int limit,
    int totalPages
) {}
