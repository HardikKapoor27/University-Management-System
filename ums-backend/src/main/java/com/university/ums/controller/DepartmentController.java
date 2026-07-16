package com.university.ums.controller;

import com.university.ums.entity.Department;
import com.university.ums.exception.DuplicateResourceException;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.DepartmentRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    @GetMapping
    public ResponseEntity<List<Department>> getAll() {
        return ResponseEntity.ok(departmentRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Department> getById(@PathVariable Long id) {
        return ResponseEntity.ok(departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Department> create(@Valid @RequestBody Department department) {
        if (departmentRepository.existsByCode(department.getCode()))
            throw new DuplicateResourceException("Department code already exists: " + department.getCode());
        return ResponseEntity.status(201).body(departmentRepository.save(department));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Department> update(@PathVariable Long id,
                                              @Valid @RequestBody Department updated) {
        Department existing = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department", id));
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        return ResponseEntity.ok(departmentRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        if (!departmentRepository.existsById(id))
            throw new ResourceNotFoundException("Department", id);
        departmentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Department deleted successfully"));
    }
}
