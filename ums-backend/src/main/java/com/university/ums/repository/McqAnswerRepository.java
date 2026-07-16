package com.university.ums.repository;

import com.university.ums.entity.McqAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface McqAnswerRepository extends JpaRepository<McqAnswer, Long> {
    List<McqAnswer> findBySubmissionId(Long submissionId);
}
