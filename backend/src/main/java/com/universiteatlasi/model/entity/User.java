package com.universiteatlasi.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "kullanicilar",
    indexes = @Index(name = "idx_kullanici_email", columnList = "email", unique = true)
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "sifre_hash", nullable = false)
    private String passwordHash;

    @Column(name = "ad")
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private String role = "USER";

    @Column(name = "aktif", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "olusturma_tarihi", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "guncelleme_tarihi")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PreferenceList> preferenceLists = new ArrayList<>();

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Spring Security
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override public String getPassword()   { return passwordHash; }
    @Override public String getUsername()   { return email; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isAccountNonLocked()      { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled()               { return active; }
}


