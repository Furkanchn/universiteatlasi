package com.universiteatlasi.model.entity;

import com.universiteatlasi.model.enums.UniversityType;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "universitetler", indexes = {
    @Index(name = "idx_universite_sehir", columnList = "sehir"),
    @Index(name = "idx_universite_tur",   columnList = "tur")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class University {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ad", nullable = false)
    private String name;

    @Column(name = "sehir", nullable = false)
    private String city;

    @Column(name = "bolge", nullable = false)
    private String region;

    @Enumerated(EnumType.STRING)
    @Column(name = "tur", nullable = false, length = 20)
    private UniversityType type;

    @Column(name = "kuruluş_yili")
    private Integer foundingYear;

    private String websiteUrl;
    private String logoUrl;

    @Column(name = "ogrenci_sayisi")
    private Integer studentCount;

    @Column(name = "ogretim_uye_sayisi")
    private Integer facultyCount;

    @Column(name = "yurt_kapasitesi")
    private Integer dormCapacity;

    @OneToMany(mappedBy = "university", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BachelorProgram> bachelorPrograms = new ArrayList<>();

}


