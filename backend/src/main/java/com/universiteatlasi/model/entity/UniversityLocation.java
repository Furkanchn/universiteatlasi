package com.universiteatlasi.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "university_locations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UniversityLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "university_id", nullable = false, unique = true)
    private University university;

    @Column(name = "latitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", nullable = false, precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "source", nullable = false, length = 100)
    private String source;

    @Column(name = "source_date", nullable = false)
    private LocalDate sourceDate;

    @Column(name = "confidence", nullable = false, length = 30)
    private String confidence;
}
