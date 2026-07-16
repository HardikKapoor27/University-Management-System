package com.university.ums.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exams")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@ToString(exclude = {"course", "results"})
public class Exam {

    public enum ExamType {
        MIDTERM, FINAL, QUIZ, ASSIGNMENT, PRACTICAL, VIVA
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExamType type;

    private LocalDateTime scheduledAt;

    private String venue;

    private Integer maxMarks;

    private Integer durationMinutes;

    private Boolean isPublished = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonIgnoreProperties({"enrollments","timetables","exams","attendances","faculty","department"})
    private Course course;

    @JsonIgnore
    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ExamResult> results = new ArrayList<>();
}
