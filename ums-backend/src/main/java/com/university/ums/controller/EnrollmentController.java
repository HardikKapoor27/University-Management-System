package com.university.ums.controller;

import com.university.ums.entity.Course;
import com.university.ums.entity.Enrollment;
import com.university.ums.entity.Student;
import com.university.ums.entity.User;
import com.university.ums.exception.DuplicateResourceException;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.CourseRepository;
import com.university.ums.repository.EnrollmentRepository;
import com.university.ums.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<Enrollment> enroll(@RequestParam Long studentId,
                                              @RequestParam Long courseId) {
        if (enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId))
            throw new DuplicateResourceException("Student already enrolled in this course");

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

        long enrolled = enrollmentRepository.countEnrolledStudents(courseId);
        if (enrolled >= course.getMaxStudents())
            throw new IllegalArgumentException("Course has reached maximum capacity");

        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);

        return ResponseEntity.status(201).body(enrollmentRepository.save(enrollment));
    }

    // Fixed: allow student to see their own enrollments without brittle SpEL
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Enrollment>> getByStudent(@PathVariable Long studentId,
                                                          Authentication auth) {
        User user = (User) auth.getPrincipal();
        boolean isAdminOrFaculty = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_FACULTY"));
        boolean isOwnStudent = user.getStudent() != null &&
            user.getStudent().getId().equals(studentId);

        if (!isAdminOrFaculty && !isOwnStudent) {
            throw new IllegalArgumentException("Access denied");
        }
        return ResponseEntity.ok(enrollmentRepository.findByStudentId(studentId));
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<List<Enrollment>> getByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(enrollmentRepository.findByCourseId(courseId));
    }

    @PatchMapping("/{id}/drop")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<Map<String, String>> drop(@PathVariable Long id) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));
        enrollment.setStatus(Enrollment.Status.DROPPED);
        enrollmentRepository.save(enrollment);
        return ResponseEntity.ok(Map.of("message", "Enrollment dropped"));
    }

    // Gradebook: faculty/admin assigns the final letter grade for an enrollment
    @PatchMapping("/{id}/grade")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<?> setGrade(@PathVariable Long id, @RequestBody Map<String, String> body,
                                       Authentication auth) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));
        boolean isFaculty = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));
        if (isFaculty) {
            User user = (User) auth.getPrincipal();
            Course course = enrollment.getCourse();
            if (user.getFaculty() != null && course.getFaculty() != null
                    && !course.getFaculty().getId().equals(user.getFaculty().getId())) {
                throw new IllegalArgumentException("You can only grade students in courses you teach.");
            }
        }
        String grade = body.get("grade");
        if (grade == null || grade.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "grade is required"));
        }
        enrollment.setGrade(Character.toUpperCase(grade.trim().charAt(0)));
        return ResponseEntity.ok(enrollmentRepository.save(enrollment));
    }
}
