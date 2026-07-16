package com.university.ums.controller;

import com.university.ums.entity.Announcement;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.AnnouncementRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementRepository announcementRepository;

    /**
     * GET /announcements
     * Returns active announcements matching the current user's role.
     * Students see ALL + STUDENT announcements.
     * Faculty see ALL + FACULTY announcements.
     * Admins see everything via /announcements/all.
     */
    @GetMapping
    public ResponseEntity<List<Announcement>> getMyAnnouncements(Authentication auth) {
        String roleStr = auth.getAuthorities().iterator().next()
                .getAuthority().replace("ROLE_", "");

        Announcement.TargetRole targetRole;
        try {
            targetRole = Announcement.TargetRole.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            targetRole = Announcement.TargetRole.ALL;
        }

        return ResponseEntity.ok(
            announcementRepository.findActiveAnnouncementsForRole(
                targetRole,
                Announcement.TargetRole.ALL   // always include "ALL" audience
            )
        );
    }

    /** Admin only — see ALL announcements including role-specific ones */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Announcement>> getAll() {
        return ResponseEntity.ok(
            announcementRepository.findByIsActiveTrueOrderByCreatedAtDesc()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Announcement> getById(@PathVariable Long id) {
        return ResponseEntity.ok(announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<Announcement> create(
            @Valid @RequestBody Announcement announcement, Authentication auth) {
        announcement.setPostedBy(auth.getName());
        return ResponseEntity.status(201).body(announcementRepository.save(announcement));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deactivate(@PathVariable Long id) {
        Announcement a = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", id));
        a.setIsActive(false);
        announcementRepository.save(a);
        return ResponseEntity.ok(Map.of("message", "Announcement deactivated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        if (!announcementRepository.existsById(id))
            throw new ResourceNotFoundException("Announcement", id);
        announcementRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Announcement deleted"));
    }
}
