package com.universiteatlasi.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    // 404 Not Found
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<HataYaniti> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new HataYaniti(404, ex.getMessage(), LocalDateTime.now()));
    }
    // 400 Validation Hataları
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<DogrulamaHataYaniti> handleValidation(
            MethodArgumentNotValidException ex) {
        Map<String, String> hatalar = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String alan = error instanceof FieldError fe ? fe.getField() : error.getObjectName();
            hatalar.put(alan, error.getDefaultMessage());
        });
        return ResponseEntity.badRequest()
            .body(new DogrulamaHataYaniti(400, "Geçersiz istek verisi", hatalar, LocalDateTime.now()));
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<DogrulamaHataYaniti> handleBindException(BindException ex) {
        Map<String, String> hatalar = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String alan = error instanceof FieldError fe ? fe.getField() : error.getObjectName();
            hatalar.put(alan, error.getDefaultMessage());
        });
        return ResponseEntity.badRequest()
            .body(new DogrulamaHataYaniti(400, "Geçersiz filtre değeri", hatalar, LocalDateTime.now()));
    }

    // 400 İş Mantığı Hataları
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<HataYaniti> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
            .body(new HataYaniti(400, ex.getMessage(), LocalDateTime.now()));
    }
    // 401 Kimlik Doğrulama Hatası
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<HataYaniti> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new HataYaniti(401, "E-posta veya şifre hatalı.", LocalDateTime.now()));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<HataYaniti> handleDisabled(DisabledException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(new HataYaniti(403, "Uyelik aktif degil.", LocalDateTime.now()));
    }
    // 500 Genel Sunucu Hatası
    @ExceptionHandler(Exception.class)
    public ResponseEntity<HataYaniti> handleGeneral(Exception ex) {
        log.error("Unhandled exception: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new HataYaniti(500, "Sunucu hatası oluştu.", LocalDateTime.now()));
    }
    // DTOs
    public record HataYaniti(int durum, String mesaj, LocalDateTime zaman) {}

    public record DogrulamaHataYaniti(
        int durum, String mesaj,
        Map<String, String> hatalar,
        LocalDateTime zaman
    ) {}
}




