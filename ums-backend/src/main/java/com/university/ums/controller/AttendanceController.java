package com.university.ums.controller;

import com.university.ums.entity.Attendance;
import com.university.ums.entity.Course;
import com.university.ums.entity.Faculty;
import com.university.ums.entity.Student;
import com.university.ums.entity.User;
import com.university.ums.exception.DuplicateResourceException;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.AttendanceRepository;
import com.university.ums.repository.CourseRepository;
import com.university.ums.repository.FacultyRepository;
import com.university.ums.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;

    // Only MENTOR faculty can mark attendance
    @PostMapping("/mark")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<Attendance> markAttendance(
            @RequestParam Long studentId,
            @RequestParam Long courseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam Attendance.AttendanceStatus status,
            @RequestParam(required = false) String remarks,
            Authentication auth) {

        // Check: if FACULTY role, must be a mentor
        if (auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"))) {
            User user = (User) auth.getPrincipal();
            if (user.getFaculty() == null || !Boolean.TRUE.equals(user.getFaculty().getIsMentor())) {
                throw new IllegalArgumentException(
                    "Only mentor faculty can mark attendance.");
            }
        }

        if (attendanceRepository.findByStudentIdAndCourseIdAndDate(studentId, courseId, date).isPresent())
            throw new DuplicateResourceException("Attendance already marked for this date");

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

        Attendance attendance = new Attendance();
        attendance.setStudent(student);
        attendance.setCourse(course);
        attendance.setDate(date);
        attendance.setStatus(status);
        attendance.setRemarks(remarks);

        // Auto-set markedBy from auth
        if (auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"))) {
            User user = (User) auth.getPrincipal();
            if (user.getFaculty() != null) {
                attendance.setMarkedBy(user.getFaculty());
            }
        }

        return ResponseEntity.status(201).body(attendanceRepository.save(attendance));
    }

    @GetMapping("/student/{studentId}/course/{courseId}")
    public ResponseEntity<Map<String, Object>> getStudentCourseAttendance(
            @PathVariable Long studentId, @PathVariable Long courseId) {
        List<Attendance> records = attendanceRepository.findByStudentIdAndCourseId(studentId, courseId);
        Double percentage = attendanceRepository.calculateAttendancePercentage(studentId, courseId);
        return ResponseEntity.ok(Map.of(
                "records", records,
                "attendancePercentage", percentage != null ? percentage : 0.0
        ));
    }

    @GetMapping("/course/{courseId}/date/{date}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<List<Attendance>> getClassAttendanceByDate(
            @PathVariable Long courseId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(attendanceRepository.findByCourseIdAndDate(courseId, date));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Attendance>> getStudentAttendance(@PathVariable Long studentId) {
        return ResponseEntity.ok(attendanceRepository.findAllByStudentOrderByDate(studentId));
    }
}
