package com.university.ums.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Announcement {

    public enum TargetRole {
        ALL, STUDENT, FACULTY, ADMIN
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, URGENT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String title;

    @NotBlank
    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    private TargetRole targetRole = TargetRole.ALL;

    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.MEDIUM;

    private String postedBy;          // username of the admin/faculty who posted

    private LocalDateTime expiresAt;  // null = never expires

    private Boolean isActive = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
