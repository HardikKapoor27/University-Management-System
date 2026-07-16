package com.university.ums.repository;

import com.university.ums.entity.McqExam;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface McqExamRepository extends JpaRepository<McqExam, Long> {
    List<McqExam> findByModuleIdOrderByCreatedAtDesc(Long moduleId);
    List<McqExam> findByModuleIdAndIsPublishedTrueOrderByCreatedAtDesc(Long moduleId);
    List<McqExam> findByCreatedByIdOrderByCreatedAtDesc(Long facultyId);
}
