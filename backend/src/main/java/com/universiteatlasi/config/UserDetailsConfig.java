package com.universiteatlasi.config;

import com.universiteatlasi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

/**
 * Separated from SecurityConfig to avoid circular dependency:
 * JwtAuthFilter -> UserDetailsService -> SecurityConfig -> JwtAuthFilter
 */
@Configuration
@RequiredArgsConstructor
public class UserDetailsConfig {

    private final UserRepository userRepo;

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> userRepo.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }
}


