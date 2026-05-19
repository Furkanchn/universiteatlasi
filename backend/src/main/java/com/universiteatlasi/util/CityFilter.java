package com.universiteatlasi.util;

import java.util.Locale;

public final class CityFilter {

    public static final String ABROAD_CITY_VALUE = "BILINMIYOR";
    public static final String CYPRUS_CITY_VALUE = "KIBRIS";

    private CityFilter() {
    }

    public static String normalize(String city) {
        if (city == null) return null;
        String trimmed = city.trim();
        if (trimmed.isBlank()) return trimmed;

        String compact = trimmed
            .toUpperCase(Locale.ROOT)
            .replace('İ', 'I')
            .replace('Ş', 'S')
            .replace('Ğ', 'G')
            .replace('Ü', 'U')
            .replace('Ö', 'O')
            .replace('Ç', 'C')
            .replaceAll("[\\s_/-]", "");

        if (compact.equals("YURTDISI") || compact.equals("ABROAD")) return ABROAD_CITY_VALUE;
        if (compact.equals("KIBRIS") || compact.equals("KKTC") || compact.equals("KIBRISKKTC")) return CYPRUS_CITY_VALUE;
        return trimmed;
    }
}
