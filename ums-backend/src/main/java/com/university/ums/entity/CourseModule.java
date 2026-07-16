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

/**
 * A "module" (a.k.a. unit / topic) within a Course. Notes, Assignments and
 * MCQ exams are all organized module-wise underneath a course, e.g.
 *   CS301 - Database Management Systems
 *     └── Module 1: ER Modeling
 *     └── Module 2: Normalization
 *     └── Module 3: Transactions & Concurrency
 */
@Entity
@Table(name = "course_modules")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@ToString(exclude = {"course", "notes", "assignments", "mcqExams"})
public class CourseModule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer orderIndex = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    @JsonIgnoreProperties({"enrollments","timetables","exams","attendances","faculty","department"})
    private Course course;

    @JsonIgnore
    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Note> notes = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Assignment> assignments = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "module", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<McqExam> mcqExams = new ArrayList<>();
}
