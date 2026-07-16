package com.university.ums.repository;

import com.university.ums.entity.McqSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface McqSubmissionRepository extends JpaRepository<McqSubmission, Long> {
    Optional<McqSubmission> findByMcqExamIdAndStudentId(Long mcqExamId, Long studentId);
    List<McqSubmission> findByMcqExamIdOrderByScoreDesc(Long mcqExamId);
    List<McqSubmission> findByStudentIdOrderBySubmittedAtDesc(Long studentId);
    boolean existsByMcqExamIdAndStudentId(Long mcqExamId, Long studentId);
}
