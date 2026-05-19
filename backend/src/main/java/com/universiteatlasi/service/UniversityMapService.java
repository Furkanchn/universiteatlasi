package com.universiteatlasi.service;

import com.universiteatlasi.model.dto.UniversityMapDto;
import com.universiteatlasi.model.entity.NearbyPlace;
import com.universiteatlasi.model.entity.UniversityLocation;
import com.universiteatlasi.repository.NearbyPlaceRepository;
import com.universiteatlasi.repository.UniversityLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UniversityMapService {

    private final UniversityLocationRepository locationRepository;
    private final NearbyPlaceRepository nearbyPlaceRepository;

    public Optional<UniversityMapDto> getMapData(Long universityId) {
        return locationRepository.findByUniversityId(universityId)
            .map(location -> new UniversityMapDto(
                location.getUniversity().getId(),
                location.getUniversity().getName(),
                location.getLatitude(),
                location.getLongitude(),
                location.getSource(),
                location.getSourceDate(),
                location.getConfidence(),
                nearbyPlaceRepository.findByUniversityIdOrderByDistanceMetersAsc(universityId).stream()
                    .map(this::toDto)
                    .toList()
            ));
    }

    private UniversityMapDto.NearbyPlaceDto toDto(NearbyPlace place) {
        return new UniversityMapDto.NearbyPlaceDto(
            place.getId(),
            place.getName(),
            place.getCategory(),
            place.getSubtype(),
            place.getLatitude(),
            place.getLongitude(),
            place.getDistanceMeters(),
            place.getSource(),
            place.getSourceDate(),
            place.getExternalId()
        );
    }
}
