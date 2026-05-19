package com.universiteatlasi.model.entity;

import com.universiteatlasi.model.enums.TeachingType;
import com.universiteatlasi.model.enums.ScoreType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "lisans_programlari", indexes = {
    @Index(name = "idx_lisans_puan_turu",     columnList = "puan_turu"),
    @Index(name = "idx_lisans_universite_id", columnList = "universite_id"),
    @Index(name = "idx_lisans_program_adi",   columnList = "program_adi")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BachelorProgram {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "universite_id")
    private University university;

    @Column(name = "fakulte", nullable = false)
    private String faculty;

    @Column(name = "program_adi", nullable = false)
    private String programName;

    @Enumerated(EnumType.STRING)
    @Column(name = "puan_turu", nullable = false, length = 10)
    private ScoreType scoreType;

    @Enumerated(EnumType.STRING)
    @Column(name = "ogretim_turu", nullable = false, length = 15)
    private TeachingType teachingType;

    @Column(name = "kontenjan", nullable = false)
    private Integer quota;

    /** Scholarship percentage 0-100. 100 = full scholarship. */
    @Column(name = "burs_orani", nullable = false)
    private Integer scholarshipRate;

    @Column(name = "ucret")
    private BigDecimal tuitionFee;

    @Column(name = "program_kodu", unique = true, length = 20)
    private String programCode;

    @Column(name = "dil", length = 50)
    private String language;

    @Column(name = "ogretim_suresi_yil")
    private Short educationDurationYears;

    @Column(name = "detail_url", length = 500)
    private String detailUrl;

    @Column(name = "yokatlas_universite_id")
    private Long yokatlasUniversityId;

    @Column(name = "yokatlas_il_kodu", length = 20)
    private String yokatlasCityCode;

    @Column(name = "yokatlas_program_grup_id", length = 50)
    private String yokatlasProgramGroupId;

    @Column(name = "program_grup_adi")
    private String programGroupName;

    @Column(name = "birim_turu_id")
    private Short unitTypeId;

    @Column(name = "birim_turu_adi", length = 100)
    private String unitTypeName;

    @Column(name = "ogrenim_turu_id")
    private Short educationTypeId;

    @Column(name = "ogrenim_turu_adi", length = 100)
    private String educationTypeName;

    @Column(name = "burs_orani_id")
    private Short scholarshipRateId;

    @Column(name = "burs_orani_adi", length = 100)
    private String scholarshipRateName;

    @Column(name = "osym_kilavuz_id")
    private Long osymGuideId;

    @Column(name = "eski_kilavuz_kodu", length = 30)
    private String previousGuideCode;

    @Column(name = "eski_birim_id")
    private Long previousUnitId;

    @Column(name = "fymk_id")
    private Long fymkId;

    @Column(name = "fymk_il_adi", length = 100)
    private String fymkCityName;

    @Column(name = "fymk_ilce_adi", length = 100)
    private String fymkDistrictName;

    @Column(name = "ilce_adi", length = 100)
    private String districtName;

    @Column(name = "akreditasyon", length = 100)
    private String accreditation;

    @Column(name = "akreditasyon_ack")
    private String accreditationDescription;

    @Column(name = "uni_akreditasyon")
    private String universityAccreditation;

    @Column(name = "kosul")
    private String conditions;

    @Column(name = "min_basari_sirasi")
    private Integer minimumSuccessRank;

    @Column(name = "min_basari_sirasi_kosul")
    private String minimumSuccessRankCondition;

    @Column(name = "kontenjan_y34")
    private Integer quotaY34;

    @Column(name = "kontenjan_dep")
    private Integer quotaDep;

    @Column(name = "kontenjan_meb")
    private Integer quotaMeb;

    @Column(name = "kontenjan_obs")
    private Integer quotaObs;

    @Column(name = "kontenjan_sgy")
    private Integer quotaSgy;

    @Column(name = "prof_sayisi")
    private Integer professorCount;

    @Column(name = "doc_sayisi")
    private Integer associateProfessorCount;

    @Column(name = "dou_sayisi")
    private Integer doctorFacultyMemberCount;

    @Column(name = "ogr_gor_sayisi")
    private Integer lecturerCount;

    @Column(name = "ar_gor_sayisi")
    private Integer researchAssistantCount;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "yokatlas_raw", columnDefinition = "jsonb", insertable = false, updatable = false)
    private Map<String, Object> yokatlasRaw;

    @OneToMany(mappedBy = "program", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<BachelorYearData> yearlyData = new ArrayList<>();
}
