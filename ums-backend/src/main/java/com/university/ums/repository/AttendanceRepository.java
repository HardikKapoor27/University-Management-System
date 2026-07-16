package com.university.ums.repository;

import com.university.ums.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentIdAndCourseId(Long studentId, Long courseId);
    List<Attendance> findByCourseIdAndDate(Long courseId, LocalDate date);
    Optional<Attendance> findByStudentIdAndCourseIdAndDate(Long studentId, Long courseId, LocalDate date);

    // Attendance % for a student in a course
    @Query("""
        SELECT
            (COUNT(CASE WHEN a.status = 'PRESENT' OR a.status = 'LATE' THEN 1 END) * 100.0) / COUNT(a)
        FROM Attendance a
        WHERE a.student.id = :studentId AND a.course.id = :courseId
    """)
    Double calculateAttendancePercentage(Long studentId, Long courseId);

    @Query("SELECT a FROM Attendance a WHERE a.student.id = :studentId ORDER BY a.date DESC")
    List<Attendance> findAllByStudentOrderByDate(Long studentId);
}
