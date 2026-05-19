package com.universiteatlasi.service;

import com.universiteatlasi.exception.ResourceNotFoundException;
import com.universiteatlasi.model.dto.AuthDto.*;
import com.universiteatlasi.model.entity.User;
import com.universiteatlasi.repository.UserRepository;
import com.universiteatlasi.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository     userRepo;
    private final PasswordEncoder    passwordEncoder;
    private final JwtService         jwtService;
    private final AuthenticationManager authManager;

    @Transactional
    public AuthResponse register(RegisterRequestDto request) {
        String email = request.email().trim().toLowerCase();
        if (userRepo.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Bu e-posta adresi zaten kayitli.");
        }

        User user = User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(request.password()))
            .name(request.name().trim())
            .build();

        userRepo.save(user);
        String token = jwtService.generateToken(user);
        return new AuthResponse(user.getId(), token, user.getEmail(), user.getName(),
            user.getRole(), System.currentTimeMillis() + jwtService.getExpirationMs());
    }

    public AuthResponse login(LoginRequestDto request) {
        String email = request.email().trim().toLowerCase();
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(email, request.password())
        );

        User user = userRepo.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));

        String token = jwtService.generateToken(user);
        return new AuthResponse(user.getId(), token, user.getEmail(), user.getName(),
            user.getRole(), System.currentTimeMillis() + jwtService.getExpirationMs());
    }
}
