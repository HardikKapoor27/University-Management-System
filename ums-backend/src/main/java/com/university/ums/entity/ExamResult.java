package com.university.ums.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_results",
       uniqueConstraints = @UniqueConstraint(columnNames = {"exam_id", "student_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@ToString(exclude = {"exam", "student"})
public class ExamResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double marksObtained;
    private Character grade;
    private Boolean isPassed;
    private String remarks;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    @JsonIgnoreProperties({"results"})
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @JsonIgnoreProperties({"enrollments","attendances","examResults","user","department"})
    private Student student;
}
