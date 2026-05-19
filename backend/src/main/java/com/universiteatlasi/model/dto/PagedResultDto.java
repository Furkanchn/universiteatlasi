package com.universiteatlasi.model.dto;

import java.util.List;

/** Paged result wrapper */
public record PagedResultDto<T>(
    List<T> data,
    MetaDto meta
) {}
