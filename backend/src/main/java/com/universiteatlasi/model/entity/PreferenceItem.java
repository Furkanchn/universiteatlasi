package com.universiteatlasi.model.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tercih_ogeleri",
    indexes = @Index(name = "idx_tercih_liste_id", columnList = "liste_id")
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PreferenceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "liste_id")
    private PreferenceList list;

    /** Preference rank: 1, 2, 3... */
    @Column(name = "sira", nullable = false)
    private Integer rank;

    @Column(name = "lisans_program_id")
    private Long bachelorProgramId;

    @Column(name = "notlar")
    private String notes;
}
