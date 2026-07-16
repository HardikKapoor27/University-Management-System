package com.university.ums.repository;

import com.university.ums.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, Long> {
    List<ExamResult> findByStudentId(Long studentId);
    List<ExamResult> findByExamId(Long examId);
    Optional<ExamResult> findByExamIdAndStudentId(Long examId, Long studentId);
    boolean existsByExamIdAndStudentId(Long examId, Long studentId);

    @Query("SELECT AVG(r.marksObtained) FROM ExamResult r WHERE r.exam.id = :examId")
    Double findAverageMarksByExam(Long examId);
}
