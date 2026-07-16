package com.university.ums.controller;

import com.university.ums.entity.CalendarEvent;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.CalendarEventRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarEventRepository calendarEventRepository;

    @GetMapping
    public List<CalendarEvent> getAll() {
        return calendarEventRepository.findAllByOrderByEventDateAsc();
    }

    @GetMapping("/upcoming")
    public List<CalendarEvent> getUpcoming() {
        return calendarEventRepository.findByEventDateGreaterThanEqualOrderByEventDateAsc(LocalDate.now());
    }

    @GetMapping("/range")
    public List<CalendarEvent> getRange(@RequestParam String start, @RequestParam String end) {
        return calendarEventRepository.findByEventDateBetweenOrderByEventDateAsc(
                LocalDate.parse(start), LocalDate.parse(end));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody CalendarEvent event, Authentication auth) {
        event.setId(null);
        event.setCreatedBy(auth.getName());
        return ResponseEntity.ok(calendarEventRepository.save(event));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody CalendarEvent updated) {
        CalendarEvent existing = calendarEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Calendar event", id));
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setEventDate(updated.getEventDate());
        existing.setEndDate(updated.getEndDate());
        existing.setType(updated.getType());
        return ResponseEntity.ok(calendarEventRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!calendarEventRepository.existsById(id)) {
            throw new ResourceNotFoundException("Calendar event", id);
        }
        calendarEventRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }
}
