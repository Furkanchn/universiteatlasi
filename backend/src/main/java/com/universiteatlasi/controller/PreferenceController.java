package com.universiteatlasi.controller;

import com.universiteatlasi.model.dto.PreferenceDto.*;
import com.universiteatlasi.model.entity.User;
import com.universiteatlasi.service.PreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/preference")
@RequiredArgsConstructor
public class PreferenceController {

    private final PreferenceService preferenceService;

    /** GET /api/preference/lists - All preference lists for the authenticated user */
    @GetMapping("/lists")
    public ResponseEntity<List<PreferenceListDto>> lists(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(preferenceService.getLists(user.getId()));
    }

    /** POST /api/preference/lists - Create new preference list */
    @PostMapping("/lists")
    public ResponseEntity<PreferenceListDto> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateListRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(preferenceService.createList(user.getId(), request));
    }

    @DeleteMapping("/lists/{listId}")
    public ResponseEntity<Void> deleteList(
            @AuthenticationPrincipal User user,
            @PathVariable String listId) {
        preferenceService.deleteList(user.getId(), listId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/lists/{listId}/rank")
    public ResponseEntity<PreferenceListDto> updateListRank(
            @AuthenticationPrincipal User user,
            @PathVariable String listId,
            @Valid @RequestBody UpdateListRankRequestDto request) {
        return ResponseEntity.ok(preferenceService.updateListRank(user.getId(), listId, request));
    }

    /** POST /api/preference/lists/{listId}/items - Add program to list */
    @PostMapping("/lists/{listId}/items")
    public ResponseEntity<PreferenceListDto> addItem(
            @AuthenticationPrincipal User user,
            @PathVariable String listId,
            @Valid @RequestBody AddItemRequestDto request) {
        return ResponseEntity.ok(preferenceService.addItem(user.getId(), listId, request));
    }

    /** DELETE /api/preference/lists/{listId}/items/{itemId} - Remove program from list */
    @DeleteMapping("/lists/{listId}/items/{itemId}")
    public ResponseEntity<Void> removeItem(
            @AuthenticationPrincipal User user,
            @PathVariable String listId,
            @PathVariable String itemId) {
        preferenceService.removeItem(user.getId(), listId, itemId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/lists/{listId}/items/{itemId}")
    public ResponseEntity<PreferenceListDto> updateItem(
            @AuthenticationPrincipal User user,
            @PathVariable String listId,
            @PathVariable String itemId,
            @RequestBody UpdateItemRequestDto request) {
        return ResponseEntity.ok(preferenceService.updateItem(user.getId(), listId, itemId, request));
    }

    /** PATCH /api/preference/lists/{listId}/reorder - Update preference order */
    @PatchMapping("/lists/{listId}/reorder")
    public ResponseEntity<PreferenceListDto> reorder(
            @AuthenticationPrincipal User user,
            @PathVariable String listId,
            @RequestBody List<String> itemIdOrder) {
        return ResponseEntity.ok(preferenceService.updateOrder(user.getId(), listId, itemIdOrder));
    }
}


