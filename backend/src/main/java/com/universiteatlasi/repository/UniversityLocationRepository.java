package com.universiteatlasi.repository;

import com.universiteatlasi.model.entity.UniversityLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UniversityLocationRepository extends JpaRepository<UniversityLocation, Long> {
    Optional<UniversityLocation> findByUniversityId(Long universityId);
}
