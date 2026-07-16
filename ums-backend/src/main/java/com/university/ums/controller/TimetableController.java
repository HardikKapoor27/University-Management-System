package com.university.ums.controller;

import com.university.ums.entity.Course;
import com.university.ums.entity.Faculty;
import com.university.ums.entity.Timetable;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.CourseRepository;
import com.university.ums.repository.FacultyRepository;
import com.university.ums.repository.TimetableRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/timetable")
@RequiredArgsConstructor
public class TimetableController {

    private final TimetableRepository timetableRepository;
    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;

    @GetMapping("/semester/{sem}")
    public ResponseEntity<List<Timetable>> getBySemester(@PathVariable Integer sem) {
        return ResponseEntity.ok(timetableRepository.findBySemester(sem));
    }

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<List<Timetable>> getByFaculty(@PathVariable Long facultyId) {
        return ResponseEntity.ok(timetableRepository.findByFacultyId(facultyId));
    }

    @GetMapping("/day/{day}")
    public ResponseEntity<List<Timetable>> getByDay(@PathVariable DayOfWeek day) {
        return ResponseEntity.ok(timetableRepository.findByDayOfWeek(day));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Timetable> create(@Valid @RequestBody Timetable timetable,
                                             @RequestParam Long courseId,
                                             @RequestParam Long facultyId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", facultyId));

        timetable.setCourse(course);
        timetable.setFaculty(faculty);
        return ResponseEntity.status(201).body(timetableRepository.save(timetable));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        if (!timetableRepository.existsById(id))
            throw new ResourceNotFoundException("Timetable", id);
        timetableRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Timetable entry deleted"));
    }
}
