package com.university.ums.repository;

import com.university.ums.entity.Faculty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    Optional<Faculty> findByEmail(String email);
    Optional<Faculty> findByEmployeeId(String employeeId);
    List<Faculty> findByDepartmentId(Long departmentId);
    Page<Faculty> findByNameContainingIgnoreCase(String name, Pageable pageable);
    boolean existsByEmail(String email);
    boolean existsByEmployeeId(String employeeId);

    @Query("SELECT f FROM Faculty f WHERE f.department.id = :deptId AND f.status = 'ACTIVE'")
    List<Faculty> findActiveFacultyByDepartment(Long deptId);
}
