package com.university.ums.controller;

import com.university.ums.entity.Department;
import com.university.ums.entity.Faculty;
import com.university.ums.exception.DuplicateResourceException;
import com.university.ums.exception.ResourceNotFoundException;
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
@RequestMapping("/faculty")
@RequiredArgsConstructor
public class FacultyController {

    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllFaculty(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("name"));
        Page<Faculty> result = (search != null && !search.isBlank())
                ? facultyRepository.findByNameContainingIgnoreCase(search, pageable)
                : facultyRepository.findAll(pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", result.getContent());
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("page", result.getNumber());
        response.put("size", result.getSize());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Faculty> getFacultyById(@PathVariable Long id) {
        return ResponseEntity.ok(facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", id)));
    }

    @GetMapping("/department/{deptId}")
    public ResponseEntity<List<Faculty>> getByDepartment(@PathVariable Long deptId) {
        return ResponseEntity.ok(facultyRepository.findByDepartmentId(deptId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Faculty> createFaculty(@Valid @RequestBody Faculty faculty,
                                                  @RequestParam Long departmentId) {
        if (facultyRepository.existsByEmail(faculty.getEmail()))
            throw new DuplicateResourceException("Email already registered: " + faculty.getEmail());
        if (facultyRepository.existsByEmployeeId(faculty.getEmployeeId()))
            throw new DuplicateResourceException("Employee ID already exists: " + faculty.getEmployeeId());

        Department dept = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", departmentId));
        faculty.setDepartment(dept);
        return ResponseEntity.status(201).body(facultyRepository.save(faculty));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Faculty> updateFaculty(@PathVariable Long id,
                                                  @Valid @RequestBody Faculty updated) {
        Faculty existing = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", id));
        existing.setName(updated.getName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setGender(updated.getGender());
        existing.setDesignation(updated.getDesignation());
        existing.setQualification(updated.getQualification());
        existing.setSpecialization(updated.getSpecialization());
        existing.setStatus(updated.getStatus());
        existing.setJoiningDate(updated.getJoiningDate());
        // BUGFIX: isMentor (the "can mark attendance" toggle) was never copied from the
        // incoming payload, so unchecking/checking it in the admin UI never persisted.
        existing.setIsMentor(updated.getIsMentor());
        return ResponseEntity.ok(facultyRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteFaculty(@PathVariable Long id) {
        if (!facultyRepository.existsById(id))
            throw new ResourceNotFoundException("Faculty", id);
        facultyRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Faculty deleted successfully"));
    }
}
