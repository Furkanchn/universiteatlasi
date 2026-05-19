package com.universiteatlasi.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "lisans_yil_verileri",
    uniqueConstraints = @UniqueConstraint(columnNames = {"program_id", "yil"}),
    indexes = {
        @Index(name = "idx_lisans_yil",        columnList = "yil"),
        @Index(name = "idx_lisans_taban_sira",  columnList = "taban_sira")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BachelorYearData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "program_id")
    private BachelorProgram program;

    @Column(name = "yil", nullable = false)
    private Integer year;

    @Column(name = "taban_puan")  private BigDecimal baseScore;
    @Column(name = "taban_sira")  private Integer    baseRank;
    @Column(name = "tavan_puan")  private BigDecimal ceilingScore;
    @Column(name = "tavan_sira")  private Integer    ceilingRank;
    @Column(name = "yerlesen")    private Integer    placed;
    @Column(name = "bos_kalan")   private Integer    remaining;
    @Column(name = "yil_kontenjan") private Integer  yearQuota;
    @Column(name = "kayit_yaptiran") private Integer registered;
    @Column(name = "ek_yerlesen") private Integer additionalPlaced;
    @Column(name = "ek_kayit_yaptiran") private Integer additionalRegistered;
}
