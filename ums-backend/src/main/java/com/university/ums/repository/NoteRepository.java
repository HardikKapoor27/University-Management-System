package com.university.ums.repository;

import com.university.ums.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByModuleIdOrderByCreatedAtDesc(Long moduleId);
    List<Note> findByModuleCourseIdOrderByCreatedAtDesc(Long courseId);
}
