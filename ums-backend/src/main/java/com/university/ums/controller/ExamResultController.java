package com.university.ums.controller;

import com.university.ums.entity.Exam;
import com.university.ums.entity.ExamResult;
import com.university.ums.entity.Student;
import com.university.ums.entity.User;
import com.university.ums.exception.DuplicateResourceException;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.ExamRepository;
import com.university.ums.repository.ExamResultRepository;
import com.university.ums.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/results")
@RequiredArgsConstructor
public class ExamResultController {

    private final ExamResultRepository resultRepository;
    private final ExamRepository examRepository;
    private final StudentRepository studentRepository;

    /** Enter result — Faculty or Admin */
    @PostMapping
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<ExamResult> enterResult(
            @RequestParam Long examId,
            @RequestParam Long studentId,
            @RequestParam Double marks,
            @RequestParam(required = false) String remarks) {

        if (resultRepository.existsByExamIdAndStudentId(examId, studentId))
            throw new DuplicateResourceException("Result already entered for this student in this exam");

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        ExamResult result = new ExamResult();
        result.setExam(exam);
        result.setStudent(student);
        result.setMarksObtained(marks);
        result.setRemarks(remarks);

        double pct = (marks / exam.getMaxMarks()) * 100;
        result.setGrade(calcGrade(pct));
        result.setIsPassed(pct >= 40);

        return ResponseEntity.status(201).body(resultRepository.save(result));
    }

    /** Student: see their own results */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<ExamResult>> getByStudent(
            @PathVariable Long studentId, Authentication auth) {
        User user = (User) auth.getPrincipal();

        boolean isAdminOrFaculty = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_FACULTY"));
        boolean isOwnStudent = user.getStudent() != null
            && user.getStudent().getId().equals(studentId);

        if (!isAdminOrFaculty && !isOwnStudent)
            throw new IllegalArgumentException("Access denied");

        return ResponseEntity.ok(resultRepository.findByStudentId(studentId));
    }

    /** Faculty/Admin: see all results for an exam with stats */
    @GetMapping("/exam/{examId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<Map<String, Object>> getByExam(@PathVariable Long examId) {
        List<ExamResult> results = resultRepository.findByExamId(examId);
        Double avg = resultRepository.findAverageMarksByExam(examId);
        return ResponseEntity.ok(Map.of(
                "results",       results,
                "averageMarks",  avg != null ? avg : 0.0,
                "totalStudents", results.size()
        ));
    }

    private char calcGrade(double pct) {
        if (pct >= 90) return 'A';
        if (pct >= 75) return 'B';
        if (pct >= 60) return 'C';
        if (pct >= 40) return 'D';
        return 'F';
    }
}
