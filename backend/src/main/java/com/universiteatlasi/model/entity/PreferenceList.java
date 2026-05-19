package com.universiteatlasi.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tercih_listeleri")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PreferenceList {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "kullanici_id")
    private User user;

    @Column(name = "ad", nullable = false)
    @Builder.Default
    private String name = "My Preference List";

    @Column(name = "ogrenim_duzeyi", nullable = false)
    private String educationLevel;

    @Column(name = "girilen_puan")    private BigDecimal enteredScore;
    @Column(name = "girilen_sira")    private Integer    enteredRank;

    @OneToMany(mappedBy = "list", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("rank ASC")
    @Builder.Default
    private List<PreferenceItem> preferences = new ArrayList<>();

    @Column(name = "olusturma_tarihi", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "guncellenme_tarihi")
    private LocalDateTime updatedAt;

    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
