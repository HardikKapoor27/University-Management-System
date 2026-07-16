package com.university.ums.repository;

import com.university.ums.entity.McqQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface McqQuestionRepository extends JpaRepository<McqQuestion, Long> {
    List<McqQuestion> findByMcqExamIdOrderByOrderIndexAsc(Long mcqExamId);
}
