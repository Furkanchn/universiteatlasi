package com.universiteatlasi.controller;

import com.universiteatlasi.model.dto.MemberDto.*;
import com.universiteatlasi.model.entity.User;
import com.universiteatlasi.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping("/me")
    public ResponseEntity<MemberProfileDto> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(memberService.getProfile(user.getId()));
    }

    @PatchMapping("/me")
    public ResponseEntity<MemberProfileDto> updateProfile(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequestDto request) {
        return ResponseEntity.ok(memberService.updateProfile(user.getId(), request));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequestDto request) {
        memberService.changePassword(user.getId(), request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deactivate(@AuthenticationPrincipal User user) {
        memberService.deactivate(user.getId());
        return ResponseEntity.noContent().build();
    }
}
