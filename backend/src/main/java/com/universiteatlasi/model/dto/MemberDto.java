package com.universiteatlasi.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class MemberDto {

    public record MemberProfileDto(
        String id,
        String email,
        String name,
        String role,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
    ) {}

    public record UpdateProfileRequestDto(
        @NotBlank String name,
        @NotBlank @Email String email
    ) {}

    public record ChangePasswordRequestDto(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String newPassword
    ) {}
}
