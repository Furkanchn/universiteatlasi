package com.universiteatlasi.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class ChatDto {

    private ChatDto() {}

    public record ChatRequest(
        @NotBlank(message = "Mesaj bos olamaz")
        @Size(max = 1000, message = "Mesaj en fazla 1000 karakter olabilir")
        String message,
        String sessionId,
        PageContext pageContext
    ) {}

    public record PageContext(
        String path,
        String title
    ) {}

    public record ChatResponse(
        String answer,
        List<ChatSource> sources,
        List<ChatAction> suggestedActions,
        String sessionId
    ) {}

    public record ChatSource(
        String label,
        String type,
        String url
    ) {}

    public record ChatAction(
        String label,
        String path
    ) {}
}
