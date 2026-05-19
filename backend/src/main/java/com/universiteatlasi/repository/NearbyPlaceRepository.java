package com.universiteatlasi.repository;

import com.universiteatlasi.model.entity.NearbyPlace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NearbyPlaceRepository extends JpaRepository<NearbyPlace, Long> {
    List<NearbyPlace> findByUniversityIdOrderByDistanceMetersAsc(Long universityId);
}
