package com.university.ums.controller;

import com.university.ums.entity.CourseModule;
import com.university.ums.entity.Note;
import com.university.ums.entity.User;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.CourseModuleRepository;
import com.university.ums.repository.NoteRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteRepository noteRepository;
    private final CourseModuleRepository moduleRepository;

    @GetMapping("/module/{moduleId}")
    public List<Note> getByModule(@PathVariable Long moduleId) {
        return noteRepository.findByModuleIdOrderByCreatedAtDesc(moduleId);
    }

    @GetMapping("/course/{courseId}")
    public List<Note> getByCourse(@PathVariable Long courseId) {
        return noteRepository.findByModuleCourseIdOrderByCreatedAtDesc(courseId);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody Note note,
                                     @RequestParam Long moduleId,
                                     Authentication auth) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module", moduleId));
        CourseModuleController.assertFacultyOwnsCourse(auth, module.getCourse());
        note.setId(null);
        note.setModule(module);
        boolean isFaculty = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));
        if (isFaculty) {
            User user = (User) auth.getPrincipal();
            note.setUploadedBy(user.getFaculty());
        }
        return ResponseEntity.status(201).body(noteRepository.save(note));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note", id));
        CourseModuleController.assertFacultyOwnsCourse(auth, note.getModule().getCourse());
        noteRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Note deleted"));
    }
}
