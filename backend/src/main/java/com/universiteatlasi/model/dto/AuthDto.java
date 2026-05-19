package com.universiteatlasi.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDto {

    public record LoginRequestDto(
        @NotBlank @Email String email,
        @NotBlank String password
    ) {}

    public record RegisterRequestDto(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") String password,
        @NotBlank String name
    ) {}

    public record AuthResponse(
        String id,
        String token,
        String email,
        String name,
        String role,
        long expiresAt   // Unix timestamp (ms)
    ) {}
}
