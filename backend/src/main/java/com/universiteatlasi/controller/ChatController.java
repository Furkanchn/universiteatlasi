package com.universiteatlasi.controller;

import com.universiteatlasi.model.dto.ChatDto.ChatRequest;
import com.universiteatlasi.model.dto.ChatDto.ChatResponse;
import com.universiteatlasi.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(chatService.answer(request));
    }
}
