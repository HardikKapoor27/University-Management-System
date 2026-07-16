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
@Table(name = "mcq_exams")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@ToString(exclude = {"module", "createdBy", "questions", "submissions"})
public class McqExam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String title;

    private Integer durationMinutes = 30;

    private Boolean isPublished = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    @JsonIgnoreProperties({"notes","assignments","mcqExams","course"})
    private CourseModule module;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({"courses","attendances","user","department"})
    private Faculty createdBy;

    @OneToMany(mappedBy = "mcqExam", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("orderIndex ASC")
    @JsonIgnoreProperties({"mcqExam"})
    private List<McqQuestion> questions = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "mcqExam", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<McqSubmission> submissions = new ArrayList<>();
}
