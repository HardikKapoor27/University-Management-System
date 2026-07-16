package com.university.ums.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "mcq_submissions",
       uniqueConstraints = @UniqueConstraint(columnNames = {"mcq_exam_id", "student_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@ToString(exclude = {"mcqExam", "student", "answers"})
public class McqSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double score = 0.0;

    private Double totalMarks = 0.0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mcq_exam_id", nullable = false)
    @JsonIgnoreProperties({"questions", "submissions", "module", "createdBy"})
    private McqExam mcqExam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"enrollments","attendances","examResults","user","department"})
    private Student student;

    @JsonIgnore
    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<McqAnswer> answers = new ArrayList<>();
}
