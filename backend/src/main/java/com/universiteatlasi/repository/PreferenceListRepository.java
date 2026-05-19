package com.universiteatlasi.repository;

import com.universiteatlasi.model.entity.PreferenceList;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PreferenceListRepository extends JpaRepository<PreferenceList, String> {

    @EntityGraph(attributePaths = "preferences")
    List<PreferenceList> findByUser_IdOrderByCreatedAtDesc(String userId);

    @EntityGraph(attributePaths = "preferences")
    Optional<PreferenceList> findByIdAndUser_Id(String id, String userId);
}
