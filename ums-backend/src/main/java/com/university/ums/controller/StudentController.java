package com.university.ums.controller;

import com.university.ums.entity.Department;
import com.university.ums.entity.Student;
import com.university.ums.exception.DuplicateResourceException;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.DepartmentRepository;
import com.university.ums.repository.StudentRepository;
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
@RequestMapping("/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllStudents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("name"));
        Page<Student> result = (search != null && !search.isBlank())
                ? studentRepository.findByNameContainingIgnoreCase(search, pageable)
                : studentRepository.findAll(pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", result.getContent());
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        return ResponseEntity.ok(studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", id)));
    }

    @GetMapping("/department/{deptId}")
    public ResponseEntity<List<Student>> getByDepartment(@PathVariable Long deptId) {
        return ResponseEntity.ok(studentRepository.findByDepartmentId(deptId));
    }

    @GetMapping("/semester/{sem}")
    public ResponseEntity<List<Student>> getBySemester(@PathVariable Integer sem) {
        return ResponseEntity.ok(studentRepository.findBySemester(sem));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Student> createStudent(@Valid @RequestBody Student student,
                                                 @RequestParam Long departmentId) {
        if (studentRepository.existsByRollNumber(student.getRollNumber()))
            throw new DuplicateResourceException("Roll number already exists: " + student.getRollNumber());
        if (studentRepository.existsByEmail(student.getEmail()))
            throw new DuplicateResourceException("Email already registered: " + student.getEmail());

        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", departmentId));
        student.setDepartment(dept);
        return ResponseEntity.status(201).body(studentRepository.save(student));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Student> updateStudent(@PathVariable Long id,
                                                 @Valid @RequestBody Student updated) {
        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));
        existing.setName(updated.getName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setGender(updated.getGender());
        existing.setDateOfBirth(updated.getDateOfBirth());
        existing.setAddress(updated.getAddress());
        existing.setSemester(updated.getSemester());
        existing.setStatus(updated.getStatus());
        return ResponseEntity.ok(studentRepository.save(existing));
    }

    @PatchMapping("/{id}/semester")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateSemester(@PathVariable Long id,
                                                               @RequestParam Integer semester) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));
        student.setSemester(semester);
        studentRepository.save(student);
        return ResponseEntity.ok(Map.of("id", id, "semester", semester, "message", "Semester updated"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteStudent(@PathVariable Long id) {
        if (!studentRepository.existsById(id))
            throw new ResourceNotFoundException("Student", id);
        studentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Student deleted successfully"));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
                "total", studentRepository.count(),
                "active", studentRepository.countActiveStudents()
        ));
    }
}
