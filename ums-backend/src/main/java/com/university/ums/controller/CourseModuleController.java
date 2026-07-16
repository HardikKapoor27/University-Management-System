package com.university.ums.controller;

import com.university.ums.entity.Course;
import com.university.ums.entity.CourseModule;
import com.university.ums.entity.User;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.CourseModuleRepository;
import com.university.ums.repository.CourseRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/modules")
@RequiredArgsConstructor
public class CourseModuleController {

    private final CourseModuleRepository moduleRepository;
    private final CourseRepository courseRepository;

    @GetMapping("/course/{courseId}")
    public List<CourseModule> getByCourse(@PathVariable Long courseId) {
        return moduleRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
    }

    @GetMapping("/{id}")
    public CourseModule getById(@PathVariable Long id) {
        return moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module", id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody CourseModule module,
                                     @RequestParam Long courseId,
                                     Authentication auth) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        assertFacultyOwnsCourse(auth, course);
        module.setId(null);
        module.setCourse(course);
        return ResponseEntity.status(201).body(moduleRepository.save(module));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody CourseModule updated,
                                     Authentication auth) {
        CourseModule existing = moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module", id));
        assertFacultyOwnsCourse(auth, existing.getCourse());
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setOrderIndex(updated.getOrderIndex());
        return ResponseEntity.ok(moduleRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        CourseModule existing = moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module", id));
        assertFacultyOwnsCourse(auth, existing.getCourse());
        moduleRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Module deleted"));
    }

    /** If the caller is FACULTY (not ADMIN), verify they teach the course. */
    static void assertFacultyOwnsCourse(Authentication auth, Course course) {
        boolean isFaculty = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));
        if (!isFaculty) return; // ADMIN bypasses this check
        User user = (User) auth.getPrincipal();
        if (user.getFaculty() != null && course.getFaculty() != null
                && !course.getFaculty().getId().equals(user.getFaculty().getId())) {
            throw new IllegalArgumentException("You can only manage content for courses you teach.");
        }
    }
}
