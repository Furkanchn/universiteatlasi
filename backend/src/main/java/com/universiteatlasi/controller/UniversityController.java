package com.universiteatlasi.controller;

import com.universiteatlasi.model.dto.UniversityMapDto;
import com.universiteatlasi.model.dto.CityLivingCostDto;
import com.universiteatlasi.model.dto.UniversityComparisonDto;
import com.universiteatlasi.model.dto.UniversityMealCostDto;
import com.universiteatlasi.model.entity.University;
import com.universiteatlasi.repository.UniversityRepository;
import com.universiteatlasi.service.CityLivingCostService;
import com.universiteatlasi.service.UniversityComparisonService;
import com.universiteatlasi.service.UniversityMealCostService;
import com.universiteatlasi.service.UniversityMapService;
import com.universiteatlasi.util.CityFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/university")
@RequiredArgsConstructor
public class UniversityController {

    private final UniversityRepository universityRepo;
    private final UniversityMapService universityMapService;
    private final CityLivingCostService cityLivingCostService;
    private final UniversityMealCostService universityMealCostService;
    private final UniversityComparisonService universityComparisonService;

    /** GET /api/university - All universities (with name and city) */
    @GetMapping
    @Cacheable("universities")
    public ResponseEntity<List<UniversitySummaryResponse>> list(
            @RequestParam(required = false) String city) {
        String normalizedCity = CityFilter.normalize(city);
        List<University> universities = normalizedCity != null
            ? universityRepo.findByCityOrderByNameAsc(normalizedCity)
            : universityRepo.findAllByOrderByNameAsc();

        return ResponseEntity.ok(universities.stream()
            .map(u -> new UniversitySummaryResponse(
                u.getId(), u.getName(), u.getCity(), u.getType().name(),
                u.getFoundingYear(), u.getWebsiteUrl(),
                u.getStudentCount(), u.getFacultyCount()
            ))
            .toList());
    }

    /** GET /api/university/compare?ids=1,2,3,4 - Decision-support comparison data */
    @GetMapping("/compare")
    public ResponseEntity<UniversityComparisonDto> compare(@RequestParam List<Long> ids) {
        return ResponseEntity.ok(universityComparisonService.compare(ids));
    }

    /** GET /api/university/{id} - University detail */
    @GetMapping("/{id}")
    public ResponseEntity<UniversityDetailResponse> detail(@PathVariable Long id) {
        return universityRepo.findById(id)
            .map(university -> ResponseEntity.ok(toDetailResponse(university)))
            .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/university/{id}/map - Location and nearby place data */
    @GetMapping("/{id}/map")
    public ResponseEntity<UniversityMapDto> map(@PathVariable Long id) {
        return universityMapService.getMapData(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/university/{id}/living-cost - Official-source city living cost data */
    @GetMapping("/{id}/living-cost")
    public ResponseEntity<CityLivingCostDto> livingCost(@PathVariable Long id) {
        return cityLivingCostService.getByUniversityId(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/university/{id}/meal-costs - Official-source university cafeteria prices */
    @GetMapping("/{id}/meal-costs")
    public ResponseEntity<UniversityMealCostDto> mealCosts(@PathVariable Long id) {
        return universityMealCostService.getByUniversityId(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /** GET /api/university/cities - Unique city list (for filter) */
    @GetMapping("/cities")
    @Cacheable("cityList")
    public ResponseEntity<List<String>> cities() {
        List<String> cities = universityRepo.findAllByOrderByNameAsc().stream()
            .map(University::getCity)
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(city -> !city.isBlank())
            .distinct()
            .sorted()
            .toList();
        return ResponseEntity.ok(cities);
    }

    public record UniversitySummaryResponse(
        Long id, String name, String city, String type,
        Integer foundingYear, String websiteUrl,
        Integer studentCount, Integer facultyCount
    ) {}

    public record UniversityDetailResponse(
        Long id,
        String name,
        String city,
        String region,
        String type,
        Integer foundingYear,
        String websiteUrl,
        String logoUrl,
        Integer studentCount,
        Integer facultyCount,
        Integer dormCapacity,
        Integer dataYear,
        Long bachelorProgramCount,
        Long facultyProgramUnitCount,
        Long totalQuota,
        Long totalPlaced,
        BigDecimal occupancyRate,
        Integer bestBaseRank,
        BigDecimal highestBaseScore,
        Map<String, Long> scoreTypeDistribution,
        Map<String, Long> teachingTypeDistribution
    ) {}

    private UniversityDetailResponse toDetailResponse(University university) {
        int year = 2025;
        Object[] metrics = universityRepo.universityProgramMetrics(university.getId(), year);
        if (metrics.length == 1 && metrics[0] instanceof Object[] nested) {
            metrics = nested;
        }

        Long programCount = longValue(metrics[0]);
        Long totalQuota = longValue(metrics[1]);
        Long unitCount = longValue(metrics[2]);
        Long totalPlaced = longValue(metrics[3]);
        Integer bestBaseRank = integerValue(metrics[4]);
        BigDecimal highestBaseScore = decimalValue(metrics[5]);
        BigDecimal occupancyRate = totalQuota > 0
            ? BigDecimal.valueOf(totalPlaced)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalQuota), 2, RoundingMode.HALF_UP)
                .min(BigDecimal.valueOf(100))
            : null;

        return new UniversityDetailResponse(
            university.getId(), university.getName(), university.getCity(), university.getRegion(), university.getType().name(),
            university.getFoundingYear(), university.getWebsiteUrl(), university.getLogoUrl(),
            university.getStudentCount(), university.getFacultyCount(), university.getDormCapacity(),
            year, programCount, unitCount, totalQuota, totalPlaced, occupancyRate, bestBaseRank, highestBaseScore,
            distribution(universityRepo.scoreTypeDistribution(university.getId())),
            distribution(universityRepo.teachingTypeDistribution(university.getId()))
        );
    }

    private Map<String, Long> distribution(List<Object[]> rows) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            if (row[0] == null) continue;
            result.put(String.valueOf(row[0]), longValue(row[1]));
        }
        return result;
    }

    private Long longValue(Object value) {
        return value instanceof Number number ? number.longValue() : 0L;
    }

    private Integer integerValue(Object value) {
        return value instanceof Number number ? number.intValue() : null;
    }

    private BigDecimal decimalValue(Object value) {
        if (value instanceof BigDecimal decimal) return decimal;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        return null;
    }
}


