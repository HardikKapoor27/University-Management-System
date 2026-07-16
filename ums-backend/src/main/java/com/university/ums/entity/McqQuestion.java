package com.university.ums.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "mcq_questions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@ToString(exclude = {"mcqExam"})
public class McqQuestion {

    public enum Option { A, B, C, D }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(columnDefinition = "TEXT")
    private String questionText;

    @NotBlank
    private String optionA;
    @NotBlank
    private String optionB;
    @NotBlank
    private String optionC;
    @NotBlank
    private String optionD;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Option correctOption;

    private Integer marks = 1;

    private Integer orderIndex = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mcq_exam_id", nullable = false)
    @JsonIgnoreProperties({"questions", "submissions", "module", "createdBy"})
    private McqExam mcqExam;
}
