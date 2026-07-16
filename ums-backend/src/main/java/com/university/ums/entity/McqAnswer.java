package com.university.ums.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mcq_answers",
       uniqueConstraints = @UniqueConstraint(columnNames = {"submission_id", "question_id"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@ToString(exclude = {"submission", "question"})
public class McqAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private McqQuestion.Option selectedOption;

    private Boolean isCorrect = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    @JsonIgnoreProperties({"answers", "mcqExam", "student"})
    private McqSubmission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @JsonIgnoreProperties({"mcqExam"})
    private McqQuestion question;
}
