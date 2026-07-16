package com.university.ums.controller;

import com.university.ums.entity.*;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final CourseModuleRepository moduleRepository;

    @GetMapping("/module/{moduleId}")
    public List<Assignment> getByModule(@PathVariable Long moduleId) {
        return assignmentRepository.findByModuleIdOrderByDeadlineAsc(moduleId);
    }

    @GetMapping("/course/{courseId}")
    public List<Assignment> getByCourse(@PathVariable Long courseId) {
        return assignmentRepository.findByModuleCourseIdOrderByDeadlineAsc(courseId);
    }

    @GetMapping("/{id}")
    public Assignment getById(@PathVariable Long id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody Assignment assignment,
                                     @RequestParam Long moduleId,
                                     Authentication auth) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module", moduleId));
        CourseModuleController.assertFacultyOwnsCourse(auth, module.getCourse());
        assignment.setId(null);
        assignment.setModule(module);
        boolean isFaculty = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));
        if (isFaculty) {
            User user = (User) auth.getPrincipal();
            assignment.setCreatedBy(user.getFaculty());
        }
        return ResponseEntity.status(201).body(assignmentRepository.save(assignment));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", id));
        CourseModuleController.assertFacultyOwnsCourse(auth, assignment.getModule().getCourse());
        assignmentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Assignment deleted"));
    }

    // ── Student submission ─────────────────────────────────────────
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submit(@PathVariable Long id, @RequestBody Map<String, String> body,
                                     Authentication auth) {
        String submissionUrl = body.get("submissionUrl");
        if (submissionUrl == null || submissionUrl.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "submissionUrl is required"));
        }
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", id));
        User user = (User) auth.getPrincipal();
        Student student = user.getStudent();
        if (student == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No student profile linked to this account"));
        }

        var existing = submissionRepository.findByAssignmentIdAndStudentId(id, student.getId());
        if (existing.isPresent() && existing.get().getMarksAwarded() != null) {
            return ResponseEntity.badRequest().body(Map.of("message", "This assignment has already been graded and cannot be resubmitted."));
        }

        AssignmentSubmission submission = existing.orElseGet(AssignmentSubmission::new);
        submission.setAssignment(assignment);
        submission.setStudent(student);
        submission.setSubmissionUrl(submissionUrl.trim());
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setIsLate(LocalDateTime.now().isAfter(assignment.getDeadline()));
        return ResponseEntity.ok(submissionRepository.save(submission));
    }

    @GetMapping("/{id}/my-submission")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> mySubmission(@PathVariable Long id, Authentication auth) {
        User user = (User) auth.getPrincipal();
        Student student = user.getStudent();
        if (student == null) return ResponseEntity.ok(Map.of());
        return ResponseEntity.ok(submissionRepository.findByAssignmentIdAndStudentId(id, student.getId())
                .orElse(null));
    }

    @GetMapping("/{id}/submissions")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<?> getSubmissions(@PathVariable Long id, Authentication auth) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", id));
        CourseModuleController.assertFacultyOwnsCourse(auth, assignment.getModule().getCourse());
        return ResponseEntity.ok(submissionRepository.findByAssignmentIdOrderBySubmittedAtDesc(id));
    }

    @PatchMapping("/submissions/{submissionId}/grade")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<?> grade(@PathVariable Long submissionId, @RequestBody Map<String, Object> body,
                                    Authentication auth) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", submissionId));
        CourseModuleController.assertFacultyOwnsCourse(auth, submission.getAssignment().getModule().getCourse());
        if (body.get("marksAwarded") != null) {
            submission.setMarksAwarded(Double.valueOf(body.get("marksAwarded").toString()));
        }
        if (body.get("feedback") != null) {
            submission.setFeedback(body.get("feedback").toString());
        }
        submission.setGradedAt(LocalDateTime.now());
        return ResponseEntity.ok(submissionRepository.save(submission));
    }
}
