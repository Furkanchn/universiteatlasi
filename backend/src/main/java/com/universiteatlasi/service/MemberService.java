package com.universiteatlasi.service;

import com.universiteatlasi.exception.ResourceNotFoundException;
import com.universiteatlasi.model.dto.MemberDto.*;
import com.universiteatlasi.model.entity.User;
import com.universiteatlasi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class MemberService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public MemberProfileDto getProfile(String userId) {
        return toProfileDto(getActiveUser(userId));
    }

    public MemberProfileDto updateProfile(String userId, UpdateProfileRequestDto request) {
        User user = getActiveUser(userId);
        String normalizedEmail = request.email().trim().toLowerCase();

        userRepo.findByEmailIgnoreCase(normalizedEmail)
            .filter(existing -> !existing.getId().equals(userId))
            .ifPresent(existing -> {
                throw new IllegalArgumentException("Bu e-posta adresi zaten kayitli.");
            });

        user.setName(request.name().trim());
        user.setEmail(normalizedEmail);
        return toProfileDto(user);
    }

    public void changePassword(String userId, ChangePasswordRequestDto request) {
        User user = getActiveUser(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    public void deactivate(String userId) {
        User user = getActiveUser(userId);
        user.setActive(false);
    }

    private User getActiveUser(String userId) {
        User user = userRepo.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found."));
        if (!user.isActive()) {
            throw new IllegalArgumentException("Uyelik aktif degil.");
        }
        return user;
    }

    private MemberProfileDto toProfileDto(User user) {
        return new MemberProfileDto(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getRole(),
            user.isActive(),
            user.getCreatedAt(),
            user.getUpdatedAt()
        );
    }
}
