package com.university.ums.repository;

import com.university.ums.entity.FeeStructure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeeStructureRepository extends JpaRepository<FeeStructure, Long> {
    List<FeeStructure> findAllByOrderByAcademicYearDescSemesterAsc();
    List<FeeStructure> findByDepartmentIdOrDepartmentIsNull(Long departmentId);
}
