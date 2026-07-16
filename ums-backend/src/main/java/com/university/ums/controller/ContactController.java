package com.university.ums.controller;

import com.university.ums.entity.ContactMessage;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.ContactMessageRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Public contact form (anyone can submit, no auth required) plus an
 * admin-only inbox to view/triage submissions.
 */
@RestController
@RequestMapping("/contact")
@RequiredArgsConstructor
public class ContactController {

    private final ContactMessageRepository contactMessageRepository;

    // Public — no authentication required. Anyone visiting the Contact page can submit.
    @PostMapping
    public ResponseEntity<?> submit(@Valid @RequestBody ContactMessage message) {
        message.setId(null);
        message.setStatus(ContactMessage.Status.NEW);
        ContactMessage saved = contactMessageRepository.save(message);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Thanks for reaching out — we'll get back to you soon.", "id", saved.getId()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ContactMessage> getAll() {
        return contactMessageRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, Long> unreadCount() {
        return Map.of("count", contactMessageRepository.countByStatus(ContactMessage.Status.NEW));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        ContactMessage msg = contactMessageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact message", id));
        try {
            msg.setStatus(ContactMessage.Status.valueOf(body.get("status").toUpperCase()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status"));
        }
        return ResponseEntity.ok(contactMessageRepository.save(msg));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!contactMessageRepository.existsById(id)) {
            throw new ResourceNotFoundException("Contact message", id);
        }
        contactMessageRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
