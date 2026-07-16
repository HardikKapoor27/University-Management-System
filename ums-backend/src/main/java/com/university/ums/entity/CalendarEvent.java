package com.university.ums.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "calendar_events")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class CalendarEvent {

    public enum EventType {
        HOLIDAY, EXAM, EVENT, DEADLINE, MEETING
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    private LocalDate eventDate;

    // Optional — for multi-day events (e.g. semester break). Null = single-day event.
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private EventType type = EventType.EVENT;

    private String createdBy; // username of the admin who created it

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
