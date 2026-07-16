package com.university.ums.repository;

import com.university.ums.entity.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, Long> {
    List<Timetable> findByFacultyId(Long facultyId);
    List<Timetable> findByCourseId(Long courseId);
    List<Timetable> findBySemester(Integer semester);
    List<Timetable> findByDayOfWeek(DayOfWeek dayOfWeek);
    List<Timetable> findBySemesterAndDayOfWeek(Integer semester, DayOfWeek dayOfWeek);
}
