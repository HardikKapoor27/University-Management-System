package com.university.ums.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * DEV ONLY — remove before production.
 * Call GET /api/v1/dev/hashes to get the correct BCrypt hashes
 * for your passwords, then paste them into the SQL file.
 */
@RestController
@RequestMapping("/dev")
@RequiredArgsConstructor
@Profile("!prod")
public class DevController {

    private final PasswordEncoder passwordEncoder;

    @GetMapping("/hashes")
    public ResponseEntity<Map<String, String>> getHashes() {
        return ResponseEntity.ok(Map.of(
            "admin123",   passwordEncoder.encode("admin123"),
            "faculty123", passwordEncoder.encode("faculty123"),
            "student123", passwordEncoder.encode("student123")
        ));
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, Boolean>> verify(
            @RequestParam String raw,
            @RequestParam String hash) {
        return ResponseEntity.ok(Map.of("matches", passwordEncoder.matches(raw, hash)));
    }
}
