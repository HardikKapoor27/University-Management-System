package com.university.ums.controller;

import com.university.ums.entity.Course;
import com.university.ums.entity.Exam;
import com.university.ums.entity.User;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.CourseRepository;
import com.university.ums.repository.ExamRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamRepository examRepository;
    private final CourseRepository courseRepository;

    // Students see published only; Faculty/Admin see all
    @GetMapping
    public ResponseEntity<List<Exam>> getAll(Authentication auth) {
        boolean isFacultyOrAdmin = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY") || a.getAuthority().equals("ROLE_ADMIN"));
        if (isFacultyOrAdmin) {
            return ResponseEntity.ok(examRepository.findAll());
        }
        return ResponseEntity.ok(examRepository.findByIsPublishedTrue());
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<Exam>> getByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(examRepository.findByCourseId(courseId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Exam> getById(@PathVariable Long id) {
        return ResponseEntity.ok(examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", id)));
    }

    // FACULTY or ADMIN can create exams
    @PostMapping
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<Exam> create(@Valid @RequestBody Exam exam,
                                        @RequestParam Long courseId,
                                        Authentication auth) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

        // If FACULTY, validate they teach this course
        boolean isFaculty = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));
        if (isFaculty) {
            User user = (User) auth.getPrincipal();
            if (user.getFaculty() != null && course.getFaculty() != null) {
                if (!course.getFaculty().getId().equals(user.getFaculty().getId())) {
                    throw new IllegalArgumentException(
                        "You can only create exams for courses you are assigned to teach.");
                }
            }
        }

        exam.setCourse(course);
        return ResponseEntity.status(201).body(examRepository.save(exam));
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<Map<String, String>> publish(@PathVariable Long id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", id));
        exam.setIsPublished(true);
        examRepository.save(exam);
        return ResponseEntity.ok(Map.of("message", "Exam published successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        if (!examRepository.existsById(id))
            throw new ResourceNotFoundException("Exam", id);
        examRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Exam deleted"));
    }
}
