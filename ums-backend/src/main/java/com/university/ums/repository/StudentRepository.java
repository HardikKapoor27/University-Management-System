package com.university.ums.repository;

import com.university.ums.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByRollNumber(String rollNumber);
    Optional<Student> findByEmail(String email);
    List<Student> findByDepartmentId(Long departmentId);
    List<Student> findBySemester(Integer semester);
    Page<Student> findByNameContainingIgnoreCase(String name, Pageable pageable);
    boolean existsByRollNumber(String rollNumber);
    boolean existsByEmail(String email);

    @Query("SELECT s FROM Student s WHERE s.department.id = :deptId AND s.semester = :sem")
    List<Student> findByDepartmentAndSemester(Long deptId, Integer sem);

    @Query("SELECT COUNT(s) FROM Student s WHERE s.status = 'ACTIVE'")
    long countActiveStudents();
}
