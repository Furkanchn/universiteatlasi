package com.universiteatlasi.repository;

import com.universiteatlasi.model.entity.University;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UniversityRepository
        extends JpaRepository<University, Long>,
                JpaSpecificationExecutor<University> {

    @Query("SELECT u FROM University u WHERE LOWER(u.city) = LOWER(:city) ORDER BY u.name ASC")
    List<University> findByCityOrderByNameAsc(@Param("city") String city);

    List<University> findAllByOrderByNameAsc();

    @Query(value = """
        SELECT
          COUNT(p.id),
          COALESCE(SUM(p.kontenjan), 0),
          COUNT(DISTINCT p.fakulte),
          COALESCE(SUM(yd.yerlesen), 0),
          min(yd.taban_sira),
          max(yd.taban_puan)
        FROM lisans_programlari p
        LEFT JOIN lisans_yil_verileri yd ON yd.program_id = p.id AND yd.yil = :year
        WHERE p.universite_id = :universityId
        """, nativeQuery = true)
    Object[] universityProgramMetrics(@Param("universityId") Long universityId, @Param("year") int year);

    @Query("""
        SELECT p.scoreType, COUNT(p)
        FROM BachelorProgram p
        WHERE p.university.id = :universityId
        GROUP BY p.scoreType
        """)
    List<Object[]> scoreTypeDistribution(@Param("universityId") Long universityId);

    @Query("""
        SELECT p.teachingType, COUNT(p)
        FROM BachelorProgram p
        WHERE p.university.id = :universityId
        GROUP BY p.teachingType
        """)
    List<Object[]> teachingTypeDistribution(@Param("universityId") Long universityId);
}
