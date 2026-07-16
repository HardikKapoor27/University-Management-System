package com.university.ums.repository;

import com.university.ums.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByCourseId(Long courseId);
    List<Exam> findByIsPublishedTrue();
    List<Exam> findByCourseIdAndType(Long courseId, Exam.ExamType type);
}
