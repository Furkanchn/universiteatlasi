package com.universiteatlasi.service;

import com.universiteatlasi.model.dto.UniversityComparisonDto;
import com.universiteatlasi.model.dto.UniversityComparisonDto.CityCostsDto;
import com.universiteatlasi.model.dto.UniversityComparisonDto.CityQualityDto;
import com.universiteatlasi.model.dto.UniversityComparisonDto.ComparisonMetricDto;
import com.universiteatlasi.model.dto.UniversityComparisonDto.UniversityComparisonItemDto;
import com.universiteatlasi.model.entity.University;
import com.universiteatlasi.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UniversityComparisonService {

    private final UniversityRepository universityRepository;
    private final JdbcTemplate jdbcTemplate;

    public UniversityComparisonDto compare(List<Long> requestedIds) {
        List<Long> ids = requestedIds.stream()
            .filter(Objects::nonNull)
            .distinct()
            .limit(4)
            .toList();

        if (ids.isEmpty()) return new UniversityComparisonDto(List.of());

        Map<Long, University> universities = universityRepository.findAllById(ids).stream()
            .collect(Collectors.toMap(University::getId, university -> university));

        Map<Long, ProgramSummary> programSummaries = programSummaries(ids);
        Map<Long, AccreditationSummary> accreditationSummaries = accreditationSummaries(ids);
        Map<Long, CampusSummary> campusSummaries = campusSummaries(ids);
        Map<Long, List<ComparisonMetricDto>> metrics = externalMetrics(ids);
        Map<Long, CityQualityDto> cityQualities = cityQualityData(ids);
        Map<Long, CityCostsDto> cityCosts = cityCostsData(ids);

        List<UniversityComparisonItemDto> items = ids.stream()
            .map(universities::get)
            .filter(Objects::nonNull)
            .map(university -> {
                ProgramSummary program = programSummaries.getOrDefault(university.getId(), ProgramSummary.empty());
                AccreditationSummary accreditation = accreditationSummaries.getOrDefault(university.getId(), AccreditationSummary.empty());
                CampusSummary campus = campusSummaries.getOrDefault(university.getId(), CampusSummary.empty());
                List<ComparisonMetricDto> allMetrics = metrics.getOrDefault(university.getId(), List.of());

                return new UniversityComparisonItemDto(
                    university.getId(),
                    university.getName(),
                    university.getCity(),
                    university.getType().name(),
                    university.getStudentCount(),
                    university.getFacultyCount(),
                    program.programCount(),
                    program.totalQuota(),
                    program.totalPlaced(),
                    program.occupancyRate(),
                    accreditation.accreditedProgramCount(),
                    accreditation.accreditationTextCount(),
                    accreditation.labels(),
                    campus.counts(),
                    campus.nearestDistances(),
                    filterMetrics(allMetrics, "accreditation"),
                    filterMetrics(allMetrics, "academic"),
                    filterMetrics(allMetrics, "satisfaction"),
                    cityQualities.get(university.getId()),
                    cityCosts.get(university.getId())
                );
            })
            .toList();

        return new UniversityComparisonDto(items);
    }

    private Map<Long, ProgramSummary> programSummaries(List<Long> ids) {
        String sql = """
            SELECT
                p.universite_id,
                COUNT(p.id)::int AS program_count,
                COALESCE(SUM(p.kontenjan), 0)::int AS total_quota,
                COALESCE(SUM(yd.yerlesen), 0)::int AS total_placed
            FROM lisans_programlari p
            LEFT JOIN lisans_yil_verileri yd ON yd.program_id = p.id AND yd.yil = 2025
            WHERE p.universite_id IN (%s)
            GROUP BY p.universite_id
            """.formatted(placeholders(ids));

        return jdbcTemplate.query(sql, ids.toArray(), rs -> {
            Map<Long, ProgramSummary> result = new HashMap<>();
            while (rs.next()) {
                int totalQuota = rs.getInt("total_quota");
                int totalPlaced = rs.getInt("total_placed");
                BigDecimal occupancyRate = totalQuota > 0
                    ? BigDecimal.valueOf(totalPlaced)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(totalQuota), 2, RoundingMode.HALF_UP)
                        .min(BigDecimal.valueOf(100))
                    : null;
                result.put(rs.getLong("universite_id"), new ProgramSummary(
                    rs.getInt("program_count"),
                    totalQuota,
                    totalPlaced,
                    occupancyRate
                ));
            }
            return result;
        });
    }

    private Map<Long, AccreditationSummary> accreditationSummaries(List<Long> ids) {
        String sql = """
            SELECT
                p.universite_id,
                COUNT(*) FILTER (WHERE NULLIF(BTRIM(p.akreditasyon), '') IS NOT NULL)::int AS accredited_count,
                COUNT(DISTINCT NULLIF(BTRIM(p.akreditasyon), ''))::int AS label_count,
                COALESCE(ARRAY_AGG(DISTINCT NULLIF(BTRIM(p.akreditasyon), '')) FILTER (WHERE NULLIF(BTRIM(p.akreditasyon), '') IS NOT NULL), ARRAY[]::text[]) AS labels
            FROM lisans_programlari p
            WHERE p.universite_id IN (%s)
            GROUP BY p.universite_id
            """.formatted(placeholders(ids));

        return jdbcTemplate.query(sql, ids.toArray(), rs -> {
            Map<Long, AccreditationSummary> result = new HashMap<>();
            while (rs.next()) {
                String[] labels = (String[]) rs.getArray("labels").getArray();
                result.put(rs.getLong("universite_id"), new AccreditationSummary(
                    rs.getInt("accredited_count"),
                    rs.getInt("label_count"),
                    Arrays.stream(labels).filter(Objects::nonNull).sorted().toList()
                ));
            }
            return result;
        });
    }

    private Map<Long, CampusSummary> campusSummaries(List<Long> ids) {
        String sql = """
            SELECT university_id, category, COUNT(*)::int AS place_count, MIN(distance_meters)::int AS nearest_distance
            FROM nearby_places
            WHERE university_id IN (%s)
            GROUP BY university_id, category
            """.formatted(placeholders(ids));

        return jdbcTemplate.query(sql, ids.toArray(), rs -> {
            Map<Long, MutableCampusSummary> mutable = new HashMap<>();
            while (rs.next()) {
                long universityId = rs.getLong("university_id");
                MutableCampusSummary summary = mutable.computeIfAbsent(universityId, ignored -> new MutableCampusSummary());
                String category = rs.getString("category");
                summary.counts.put(category, rs.getInt("place_count"));
                summary.nearestDistances.put(category, rs.getInt("nearest_distance"));
            }
            Map<Long, CampusSummary> result = new HashMap<>();
            mutable.forEach((key, value) -> result.put(key, new CampusSummary(value.counts, value.nearestDistances)));
            return result;
        });
    }

    private Map<Long, List<ComparisonMetricDto>> externalMetrics(List<Long> ids) {
        String sql = """
            SELECT university_id, category, metric_key, label, numeric_value, text_value, unit, period_label, source_name
            FROM university_external_metrics
            WHERE university_id IN (%s)
            ORDER BY university_id, category, sort_order, label
            """.formatted(placeholders(ids));

        return jdbcTemplate.query(sql, ids.toArray(), rs -> {
            Map<Long, List<ComparisonMetricDto>> result = new HashMap<>();
            while (rs.next()) {
                result.computeIfAbsent(rs.getLong("university_id"), ignored -> new ArrayList<>())
                    .add(new ComparisonMetricDto(
                        rs.getString("category"),
                        rs.getString("metric_key"),
                        rs.getString("label"),
                        rs.getBigDecimal("numeric_value"),
                        rs.getString("text_value"),
                        rs.getString("unit"),
                        rs.getString("period_label"),
                        rs.getString("source_name")
                    ));
            }
            return result;
        });
    }

    private static List<ComparisonMetricDto> filterMetrics(List<ComparisonMetricDto> metrics, String category) {
        return metrics.stream()
            .filter(metric -> category.equals(metric.category()))
            .toList();
    }

    private Map<Long, CityQualityDto> cityQualityData(List<Long> ids) {
        String sql = """
            SELECT u.id AS university_id,
                   c.sehir, c.quality_of_life_index, c.purchasing_power_index, c.safety_index,
                   c.health_care_index, c.climate_index, c.cost_of_living_index,
                   c.property_price_to_income_ratio, c.traffic_commute_time_index, c.pollution_index
            FROM universitetler u
            LEFT JOIN city_quality_indices c
              ON TRANSLATE(LOWER(c.sehir), 'ığüşöçı', 'igusoci')
               = TRANSLATE(LOWER(u.sehir), 'ığüşöçı', 'igusoci')
            WHERE u.id IN (%s)
            """.formatted(placeholders(ids));

        return jdbcTemplate.query(sql, ids.toArray(), rs -> {
            Map<Long, CityQualityDto> result = new HashMap<>();
            while (rs.next()) {
                if (rs.getString("sehir") != null) {
                    result.put(rs.getLong("university_id"), new CityQualityDto(
                        rs.getString("sehir"),
                        rs.getBigDecimal("quality_of_life_index"),
                        rs.getBigDecimal("purchasing_power_index"),
                        rs.getBigDecimal("safety_index"),
                        rs.getBigDecimal("health_care_index"),
                        rs.getBigDecimal("climate_index"),
                        rs.getBigDecimal("cost_of_living_index"),
                        rs.getBigDecimal("property_price_to_income_ratio"),
                        rs.getBigDecimal("traffic_commute_time_index"),
                        rs.getBigDecimal("pollution_index")
                    ));
                }
            }
            return result;
        });
    }

    private Map<Long, CityCostsDto> cityCostsData(List<Long> ids) {
        String sql = """
            SELECT u.id AS university_id,
                   n.sehir, n.cheap_restaurant_meal, n.utilities_85m2, n.mobile_plan,
                   n.internet_60mbps, n.fitness_monthly, n.cinema_ticket,
                   n.rent_1br_center, n.rent_1br_outside, n.rent_3br_center, n.rent_3br_outside,
                   n.avg_monthly_salary, n.mortgage_rate_pct, n.is_synthetic
            FROM universitetler u
            LEFT JOIN numbeo_city_costs n
              ON TRANSLATE(LOWER(n.sehir), 'ığüşöçı', 'igusoci')
               = TRANSLATE(LOWER(u.sehir), 'ığüşöçı', 'igusoci')
            WHERE u.id IN (%s)
            """.formatted(placeholders(ids));

        return jdbcTemplate.query(sql, ids.toArray(), rs -> {
            Map<Long, CityCostsDto> result = new HashMap<>();
            while (rs.next()) {
                if (rs.getString("sehir") != null) {
                    result.put(rs.getLong("university_id"), new CityCostsDto(
                        rs.getString("sehir"),
                        rs.getBigDecimal("cheap_restaurant_meal"),
                        rs.getBigDecimal("utilities_85m2"),
                        rs.getBigDecimal("mobile_plan"),
                        rs.getBigDecimal("internet_60mbps"),
                        rs.getBigDecimal("fitness_monthly"),
                        rs.getBigDecimal("cinema_ticket"),
                        rs.getBigDecimal("rent_1br_center"),
                        rs.getBigDecimal("rent_1br_outside"),
                        rs.getBigDecimal("rent_3br_center"),
                        rs.getBigDecimal("rent_3br_outside"),
                        rs.getBigDecimal("avg_monthly_salary"),
                        rs.getBigDecimal("mortgage_rate_pct"),
                        rs.getBoolean("is_synthetic")
                    ));
                }
            }
            return result;
        });
    }

    private static String placeholders(List<Long> ids) {
        return ids.stream().map(ignored -> "?").collect(Collectors.joining(","));
    }

    private record ProgramSummary(Integer programCount, Integer totalQuota, Integer totalPlaced, BigDecimal occupancyRate) {
        static ProgramSummary empty() {
            return new ProgramSummary(0, 0, 0, null);
        }
    }

    private record AccreditationSummary(Integer accreditedProgramCount, Integer accreditationTextCount, List<String> labels) {
        static AccreditationSummary empty() {
            return new AccreditationSummary(0, 0, List.of());
        }
    }

    private record CampusSummary(Map<String, Integer> counts, Map<String, Integer> nearestDistances) {
        static CampusSummary empty() {
            return new CampusSummary(Map.of(), Map.of());
        }
    }

    private static final class MutableCampusSummary {
        private final Map<String, Integer> counts = new LinkedHashMap<>();
        private final Map<String, Integer> nearestDistances = new LinkedHashMap<>();
    }
}
