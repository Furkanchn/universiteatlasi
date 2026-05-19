package com.universiteatlasi.service;

import com.universiteatlasi.exception.ResourceNotFoundException;
import com.universiteatlasi.model.dto.*;
import com.universiteatlasi.model.dto.ScoreBreakdownDto;
import com.universiteatlasi.model.entity.BachelorProgram;
import com.universiteatlasi.model.entity.BachelorYearData;
import com.universiteatlasi.model.enums.TeachingType;
import com.universiteatlasi.model.enums.ScoreType;
import com.universiteatlasi.model.enums.UniversityType;
import com.universiteatlasi.repository.BachelorProgramRepository;
import com.universiteatlasi.util.CityFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BachelorService {

    private final BachelorProgramRepository repo;
    // Program list
    @Cacheable(value = "bachelorPrograms", key = "#filter.hashCode()")
    public PagedResultDto<BachelorProgramSummaryDto> getPrograms(BachelorFilterDto filter) {

        UniversityType uniType   = parseEnum(UniversityType.class, filter.universityType());
        ScoreType      scoreType = filter.scoreType();
        TeachingType   teachingType = filter.teachingType();

        Specification<BachelorProgram> spec = BachelorProgramRepository.buildSpecification(
            filter.search(), filter.city(), filter.universityId(),
            uniType, scoreType, teachingType,
            filter.minQuota(), filter.maxQuota(),
            filter.minRank(), filter.maxRank(),
            filter.minBaseScore(), filter.maxBaseScore(),
            2025,
            filter.sort()
        );

        // Rank bazlı sıralama Specification içinde yapılıyor; diğerleri Sort ile
        Sort sort = buildSort(filter.sort());
        Pageable pageable = PageRequest.of(filter.page() - 1, filter.limit(), sort);

        Page<BachelorProgram> page = repo.findAll(spec, pageable);

        List<BachelorProgramSummaryDto> data = page.getContent().stream()
            .map(p -> toSummaryDto(p, 2025))
            .toList();

        return new PagedResultDto<>(data, new MetaDto(
            page.getTotalElements(),
            filter.page(),
            filter.limit(),
            page.getTotalPages()
        ));
    }
    // Program detail
    @Cacheable(value = "bachelorProgramDetail", key = "#id")
    public BachelorProgramDetailDto getProgramDetail(Long id) {
        BachelorProgram program = repo.findByIdWithDetails(id)
            .orElseThrow(() -> new ResourceNotFoundException("Program not found: " + id));
        return toDetailDto(program);
    }

    @Cacheable("bachelorProgramNames")
    public List<String> getProgramNames() {
        return repo.findDistinctProgramNames();
    }
    // Preference wizard matching
    public List<PreferenceMatchDto> wizardMatch(ScoreType scoreType, int rank, int year, String city, String search) {
        String normalizedCity = blankToNull(CityFilter.normalize(city));
        String normalizedSearch = blankToNull(search);
        List<BachelorProgram> programs = findWizardMatches(scoreType, rank, year, normalizedCity, normalizedSearch);

        return programs.stream()
            .map(p -> {
                Integer baseRank = p.getYearlyData().stream()
                    .filter(yd -> yd.getYear() == year)
                    .findFirst()
                    .map(BachelorYearData::getBaseRank)
                    .orElse(null);

                String status = determineStatus(rank, baseRank);
                return new PreferenceMatchDto(toSummaryDto(p, year), status, statusReason(status));
            })
            .sorted(Comparator.comparing(dto -> statusOrder(dto.status())))
            .limit(200)
            .toList();
    }
    // Net to score calculation
    /**
     * @param diplomaGrade Lise diploma notu (0-100 arası). OBP = diplomaGrade x 5 (0-500).
     *                     Girilmezse (null) OBP katkısı hesaba katılmaz.
     */
    public ScoreBreakdownDto calculateScore(ScoreType scoreType,
                                            double tytNet,
                                            double aytNet,
                                            Double diplomaGrade) {
        double obp = (diplomaGrade != null)
                ? Math.min(Math.max(diplomaGrade, 0), 100) * 5.0   // 0-500
                : 0.0;

        double hamPuan = switch (scoreType) {
            case SAY -> 160.0 + (tytNet * 1.6)  + (aytNet * 3.5);
            case EA  -> 160.0 + (tytNet * 1.6)  + (aytNet * 3.0);
            case SOZ -> 160.0 + (tytNet * 1.6)  + (aytNet * 2.8);
            case DIL -> 160.0 + (tytNet * 0.8)  + (aytNet * 4.0);
            case TYT -> 100.0 + (tytNet * 1.333);
        };

        double obpKatkisi = (scoreType == ScoreType.TYT)
                ? obp * 0.06
                : obp * 0.12;

        double toplamPuan = hamPuan + obpKatkisi;

        return new ScoreBreakdownDto(scoreType, tytNet, aytNet, diplomaGrade, obp,
                                     round2(hamPuan), round2(obpKatkisi), round2(toplamPuan));
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
    // Helper methods

    private String determineStatus(int userRank, Integer baseRank) {
        if (baseRank == null) return "UNKNOWN";
        double ratio = (double) userRank / baseRank;
        if (ratio <= 0.8)  return "CERTAIN";
        if (ratio <= 1.2)  return "RISKY";
        return "DIFFICULT";
    }

    private int statusOrder(String status) {
        return switch (status) { case "CERTAIN" -> 0; case "RISKY" -> 1; default -> 2; };
    }

    private String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private List<BachelorProgram> findWizardMatches(
            ScoreType scoreType, int rank, int year, String city, String search) {
        if (city != null && search != null) {
            return repo.findWizardMatchesByCityAndSearch(scoreType, year, rank, city, search);
        }
        if (city != null) return repo.findWizardMatchesByCity(scoreType, year, rank, city);
        if (search != null) return repo.findWizardMatchesBySearch(scoreType, year, rank, search);
        return repo.findWizardMatches(scoreType, year, rank);
    }

    private String statusReason(String status) {
        return switch (status) {
            case "CERTAIN" -> "Başarı sıran geçen yılın taban sırasından belirgin şekilde daha iyi.";
            case "RISKY" -> "Başarı sıran geçen yılın taban sırasına yakın.";
            case "DIFFICULT" -> "Başarı sıran geçen yılın taban sırasından daha geride.";
            default -> "Taban sıra verisi eksik olduğu için kesin yorum yapılamıyor.";
        };
    }

    private Sort buildSort(String sort) {
        if (sort == null) return Sort.by("programName").ascending();
        return switch (sort) {
            case "baseRank_asc", "baseRank_desc" -> Sort.unsorted();
            case "quota_asc" -> Sort.by("quota").ascending();
            case "quota_desc" -> Sort.by("quota").descending();
            case "programName_desc" -> Sort.by("programName").descending();
            default -> Sort.by("programName").ascending();
        };
    }

    private BachelorProgramSummaryDto toSummaryDto(BachelorProgram p, int year) {
        BachelorYearData yd = p.getYearlyData().stream()
            .filter(v -> v.getYear() == year)
            .findFirst().orElse(null);

        return new BachelorProgramSummaryDto(
            p.getId(), p.getProgramName(), p.getFaculty(),
            p.getScoreType(), p.getTeachingType(), p.getQuota(), p.getScholarshipRate(),
            p.getProgramCode(), p.getLanguage(), p.getEducationDurationYears(), p.getDetailUrl(),
            p.getProgramGroupName(), p.getUnitTypeName(), p.getEducationTypeName(), p.getScholarshipRateName(),
            new UniversitySummaryDto(
                p.getUniversity().getId(), p.getUniversity().getName(),
                p.getUniversity().getCity(), p.getUniversity().getType().name()
            ),
            yd == null ? null : new YearDataDto(
                yd.getYear(), yd.getBaseScore(), yd.getBaseRank(),
                yd.getCeilingScore(), yd.getCeilingRank(), yd.getPlaced(), yd.getRemaining(),
                yd.getYearQuota(), yd.getRegistered(), yd.getAdditionalPlaced(), yd.getAdditionalRegistered()
            )
        );
    }

    private BachelorProgramDetailDto toDetailDto(BachelorProgram p) {
        List<YearDataDto> yearlyData = p.getYearlyData().stream()
            .sorted(Comparator.comparingInt(BachelorYearData::getYear).reversed())
            .map(yd -> new YearDataDto(
                yd.getYear(), yd.getBaseScore(), yd.getBaseRank(),
                yd.getCeilingScore(), yd.getCeilingRank(), yd.getPlaced(), yd.getRemaining(),
                yd.getYearQuota(), yd.getRegistered(), yd.getAdditionalPlaced(), yd.getAdditionalRegistered()
            ))
            .toList();

        return new BachelorProgramDetailDto(
            p.getId(), p.getProgramName(), p.getFaculty(),
            p.getScoreType(), p.getTeachingType(), p.getQuota(), p.getScholarshipRate(),
            p.getTuitionFee(),
            p.getProgramCode(), p.getLanguage(), p.getEducationDurationYears(), p.getDetailUrl(),
            p.getYokatlasUniversityId(), p.getYokatlasCityCode(), p.getYokatlasProgramGroupId(),
            p.getProgramGroupName(), p.getUnitTypeId(), p.getUnitTypeName(),
            p.getEducationTypeId(), p.getEducationTypeName(),
            p.getScholarshipRateId(), p.getScholarshipRateName(),
            p.getOsymGuideId(), p.getPreviousGuideCode(), p.getPreviousUnitId(),
            p.getFymkId(), p.getFymkCityName(), p.getFymkDistrictName(), p.getDistrictName(),
            p.getAccreditation(), p.getAccreditationDescription(), p.getUniversityAccreditation(),
            p.getConditions(), p.getMinimumSuccessRank(), p.getMinimumSuccessRankCondition(),
            p.getQuotaY34(), p.getQuotaDep(), p.getQuotaMeb(), p.getQuotaObs(), p.getQuotaSgy(),
            rawInt(p, "y34Y", "y34"), rawInt(p, "dprmY"), rawInt(p, "obkY"), rawInt(p, "sgyY"),
            rawString(p, "tyc"), rawString(p, "uygulamaliEgitimModeli"),
            rawInt(p, "female_count"), rawInt(p, "male_count"),
            rawInt(p, "new_grad_count"), rawInt(p, "old_grad_count"),
            rawListOfMaps(p, "net_ortalamalari"),
            p.getProfessorCount(), p.getAssociateProfessorCount(), p.getDoctorFacultyMemberCount(),
            p.getLecturerCount(), p.getResearchAssistantCount(),
            new UniversitySummaryDto(
                p.getUniversity().getId(), p.getUniversity().getName(),
                p.getUniversity().getCity(), p.getUniversity().getType().name()
            ),
            yearlyData
        );
    }

    private Integer rawInt(BachelorProgram program, String... keys) {
        Object value = rawValue(program, keys);
        if (value == null) return null;
        if (value instanceof Number number) return number.intValue();
        String text = String.valueOf(value).trim();
        if (text.isBlank() || "-".equals(text)) return null;
        try {
            return Integer.valueOf(text.replaceAll("\\D", ""));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String rawString(BachelorProgram program, String... keys) {
        Object value = rawValue(program, keys);
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        return text.isBlank() || "*".equals(text) ? null : text;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> rawListOfMaps(BachelorProgram program, String key) {
        Object value = rawValue(program, key);
        if (!(value instanceof List<?> list)) return List.of();
        return list.stream()
            .filter(Map.class::isInstance)
            .map(item -> (Map<String, Object>) item)
            .toList();
    }

    private Object rawValue(BachelorProgram program, String... keys) {
        Map<String, Object> raw = program.getYokatlasRaw();
        if (raw == null) return null;
        for (String key : keys) {
            Object value = raw.get(key);
            if (value != null) return value;
        }
        return null;
    }

    private <E extends Enum<E>> E parseEnum(Class<E> clazz, String value) {
        if (value == null || value.isBlank()) return null;
        try { return Enum.valueOf(clazz, value.toUpperCase()); }
        catch (IllegalArgumentException e) { return null; }
    }
}





