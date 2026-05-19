package com.universiteatlasi.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "nearby_places", indexes = {
    @Index(name = "idx_nearby_places_university", columnList = "university_id"),
    @Index(name = "idx_nearby_places_category", columnList = "category"),
    @Index(name = "idx_nearby_places_distance", columnList = "university_id, category, distance_meters")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NearbyPlace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "university_id", nullable = false)
    private University university;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "category", nullable = false, length = 30)
    private String category;

    @Column(name = "subtype", length = 40)
    private String subtype;

    @Column(name = "latitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "distance_meters", nullable = false)
    private Integer distanceMeters;

    @Column(name = "source", nullable = false, length = 100)
    private String source;

    @Column(name = "source_date", nullable = false)
    private LocalDate sourceDate;

    @Column(name = "external_id", length = 80)
    private String externalId;
}
