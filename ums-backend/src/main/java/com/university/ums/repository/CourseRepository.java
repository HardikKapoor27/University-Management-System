package com.university.ums.repository;

import com.university.ums.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    Optional<Course> findByCourseCode(String courseCode);
    List<Course> findByDepartmentId(Long departmentId);
    List<Course> findByFacultyId(Long facultyId);
    List<Course> findBySemester(Integer semester);
    Page<Course> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    boolean existsByCourseCode(String courseCode);
}
