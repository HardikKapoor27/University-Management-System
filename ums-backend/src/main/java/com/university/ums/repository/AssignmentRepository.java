package com.university.ums.repository;

import com.university.ums.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByModuleIdOrderByDeadlineAsc(Long moduleId);
    List<Assignment> findByModuleCourseIdOrderByDeadlineAsc(Long courseId);
    List<Assignment> findByCreatedByIdOrderByDeadlineDesc(Long facultyId);
}
