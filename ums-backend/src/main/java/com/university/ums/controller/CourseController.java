package com.university.ums.controller;

import com.university.ums.entity.Course;
import com.university.ums.entity.Department;
import com.university.ums.entity.Faculty;
import com.university.ums.exception.DuplicateResourceException;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.CourseRepository;
import com.university.ums.repository.DepartmentRepository;
import com.university.ums.repository.FacultyRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseRepository courseRepository;
    private final DepartmentRepository departmentRepository;
    private final FacultyRepository facultyRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("title"));
        Page<Course> result = (search != null && !search.isBlank())
                ? courseRepository.findByTitleContainingIgnoreCase(search, pageable)
                : courseRepository.findAll(pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", result.getContent());
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getById(@PathVariable Long id) {
        return ResponseEntity.ok(courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id)));
    }

    @GetMapping("/semester/{sem}")
    public ResponseEntity<List<Course>> getBySemester(@PathVariable Integer sem) {
        return ResponseEntity.ok(courseRepository.findBySemester(sem));
    }

    @GetMapping("/department/{deptId}")
    public ResponseEntity<List<Course>> getByDepartment(@PathVariable Long deptId) {
        return ResponseEntity.ok(courseRepository.findByDepartmentId(deptId));
    }

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<List<Course>> getByFaculty(@PathVariable Long facultyId) {
        return ResponseEntity.ok(courseRepository.findByFacultyId(facultyId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Course> create(@Valid @RequestBody Course course,
                                          @RequestParam Long departmentId,
                                          @RequestParam Long facultyId) {
        if (courseRepository.existsByCourseCode(course.getCourseCode()))
            throw new DuplicateResourceException("Course code already exists: " + course.getCourseCode());

        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", departmentId));
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", facultyId));

        course.setDepartment(dept);
        course.setFaculty(faculty);
        return ResponseEntity.status(201).body(courseRepository.save(course));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody Course updated,
                                     org.springframework.security.core.Authentication auth) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", id));

        boolean isFaculty = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));
        if (isFaculty) {
            com.university.ums.entity.User user = (com.university.ums.entity.User) auth.getPrincipal();
            if (user.getFaculty() == null || existing.getFaculty() == null
                    || !existing.getFaculty().getId().equals(user.getFaculty().getId())) {
                return ResponseEntity.status(403).body(Map.of("message", "You can only edit courses you teach."));
            }
        }

        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setCredits(updated.getCredits());
        existing.setSyllabus(updated.getSyllabus());
        existing.setMaxStudents(updated.getMaxStudents());
        existing.setIsActive(updated.getIsActive());
        return ResponseEntity.ok(courseRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        if (!courseRepository.existsById(id))
            throw new ResourceNotFoundException("Course", id);
        courseRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Course deleted successfully"));
    }
}
