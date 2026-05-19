package com.universiteatlasi.repository;

import com.universiteatlasi.model.entity.BachelorProgram;
import com.universiteatlasi.model.enums.ScoreType;
import com.universiteatlasi.model.enums.TeachingType;
import com.universiteatlasi.model.enums.UniversityType;
import com.universiteatlasi.util.CityFilter;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Repository
public interface BachelorProgramRepository
        extends JpaRepository<BachelorProgram, Long>,
                JpaSpecificationExecutor<BachelorProgram> {

    /** Detail page: university and all year data in a single query. */
    @Query("""
        SELECT p FROM BachelorProgram p
        JOIN FETCH p.university u
        LEFT JOIN FETCH p.yearlyData yd
        WHERE p.id = :id
        ORDER BY yd.year DESC
        """)
    Optional<BachelorProgram> findByIdWithDetails(Long id);

    /** Wizard: programs with base rank >= user rank for given score type and year. */
    @Query("""
        SELECT p FROM BachelorProgram p
        JOIN FETCH p.university u
        JOIN FETCH p.yearlyData yd
        WHERE p.scoreType = :scoreType
          AND yd.year = :year
          AND yd.baseRank >= :userRank
        ORDER BY yd.baseRank ASC
        """)
    List<BachelorProgram> findWizardMatches(
        @org.springframework.data.repository.query.Param("scoreType") ScoreType scoreType,
        int year,
        int userRank
    );

    @Query("""
        SELECT p FROM BachelorProgram p
        JOIN FETCH p.university u
        JOIN FETCH p.yearlyData yd
        WHERE p.scoreType = :scoreType
          AND yd.year = :year
          AND yd.baseRank >= :userRank
          AND u.city = :city
        ORDER BY yd.baseRank ASC
        """)
    List<BachelorProgram> findWizardMatchesByCity(
        @org.springframework.data.repository.query.Param("scoreType") ScoreType scoreType,
        int year,
        int userRank,
        String city
    );

    @Query("""
        SELECT p FROM BachelorProgram p
        JOIN FETCH p.university u
        JOIN FETCH p.yearlyData yd
        WHERE p.scoreType = :scoreType
          AND yd.year = :year
          AND yd.baseRank >= :userRank
          AND (LOWER(p.programName) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY yd.baseRank ASC
        """)
    List<BachelorProgram> findWizardMatchesBySearch(
        @org.springframework.data.repository.query.Param("scoreType") ScoreType scoreType,
        int year,
        int userRank,
        String search
    );

    @Query("""
        SELECT p FROM BachelorProgram p
        JOIN FETCH p.university u
        JOIN FETCH p.yearlyData yd
        WHERE p.scoreType = :scoreType
          AND yd.year = :year
          AND yd.baseRank >= :userRank
          AND u.city = :city
          AND (LOWER(p.programName) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY yd.baseRank ASC
        """)
    List<BachelorProgram> findWizardMatchesByCityAndSearch(
        @org.springframework.data.repository.query.Param("scoreType") ScoreType scoreType,
        int year,
        int userRank,
        String city,
        String search
    );

    @Query("""
        SELECT DISTINCT p.programName FROM BachelorProgram p
        ORDER BY p.programName ASC
        """)
    List<String> findDistinctProgramNames();

    static Specification<BachelorProgram> buildSpecification(
            String search,
            String city,
            Long universityId,
            UniversityType universityType,
            ScoreType scoreType,
            TeachingType teachingType,
            Integer minQuota,
            Integer maxQuota,
            Integer minRank,
            Integer maxRank,
            BigDecimal minBaseScore,
            BigDecimal maxBaseScore,
            Integer year,
            String sort
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            boolean isCountQuery = query != null &&
                    (Long.class == query.getResultType() || long.class == query.getResultType());

            String normalizedCity = CityFilter.normalize(city);
            boolean hasCityFilter = normalizedCity != null && !normalizedCity.isBlank();
            boolean needsUniJoin = (search != null && !search.isBlank())
                    || hasCityFilter || universityId != null || universityType != null;
            Join<?, ?> university = root.join("university", needsUniJoin ? JoinType.INNER : JoinType.LEFT);

            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase(new Locale("tr")) + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("programName")), like),
                    cb.like(cb.lower(university.get("name")), like)
                ));
            }

            if (hasCityFilter) {
                predicates.add(cb.equal(cb.upper(university.get("city")), normalizedCity.toUpperCase(new Locale("tr"))));
            }
            if (universityId != null) predicates.add(cb.equal(university.get("id"), universityId));
            if (universityType != null) predicates.add(cb.equal(university.get("type"), universityType));
            if (scoreType != null) predicates.add(cb.equal(root.get("scoreType"), scoreType));
            if (teachingType != null) predicates.add(cb.equal(root.get("teachingType"), teachingType));
            if (minQuota != null) predicates.add(cb.greaterThanOrEqualTo(root.get("quota"), minQuota));
            if (maxQuota != null) predicates.add(cb.lessThanOrEqualTo(root.get("quota"), maxQuota));

            boolean rankSort = sort != null && sort.startsWith("baseRank");
            boolean hasYearDataFilter = minRank != null || maxRank != null
                    || minBaseScore != null || maxBaseScore != null;
            boolean needsYearJoin = hasYearDataFilter || (!isCountQuery && rankSort);

            if (needsYearJoin && year != null) {
                Join<?, ?> yd = root.join("yearlyData", JoinType.LEFT);
                predicates.add(cb.equal(yd.get("year"), year));

                if (minRank != null) predicates.add(cb.greaterThanOrEqualTo(yd.get("baseRank"), minRank));
                if (maxRank != null) predicates.add(cb.lessThanOrEqualTo(yd.get("baseRank"), maxRank));
                if (minBaseScore != null) predicates.add(cb.greaterThanOrEqualTo(yd.get("baseScore"), minBaseScore));
                if (maxBaseScore != null) predicates.add(cb.lessThanOrEqualTo(yd.get("baseScore"), maxBaseScore));

                if (!isCountQuery && query != null && rankSort) {
                    query.orderBy(switch (sort) {
                        case "baseRank_desc" -> cb.desc(yd.get("baseRank"));
                        default -> cb.asc(yd.get("baseRank"));
                    });
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
