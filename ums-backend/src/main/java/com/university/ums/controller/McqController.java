package com.university.ums.controller;

import com.university.ums.entity.*;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.*;
import com.university.ums.util.McqDocumentParser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/mcq")
@RequiredArgsConstructor
public class McqController {

    private final McqExamRepository mcqExamRepository;
    private final McqQuestionRepository mcqQuestionRepository;
    private final McqSubmissionRepository mcqSubmissionRepository;
    private final McqAnswerRepository mcqAnswerRepository;
    private final CourseModuleRepository moduleRepository;

    @GetMapping("/module/{moduleId}")
    public List<McqExam> getByModule(@PathVariable Long moduleId, Authentication auth) {
        boolean isFacultyOrAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY") || a.getAuthority().equals("ROLE_ADMIN"));
        if (isFacultyOrAdmin) {
            return mcqExamRepository.findByModuleIdOrderByCreatedAtDesc(moduleId);
        }
        return mcqExamRepository.findByModuleIdAndIsPublishedTrueOrderByCreatedAtDesc(moduleId);
    }

    // Full detail — includes correct answers. For faculty/admin management use only.
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public McqExam getById(@PathVariable Long id) {
        return mcqExamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MCQ exam", id));
    }

    // Student-safe view for actually taking the exam — correct answers stripped out.
    @GetMapping("/{id}/take")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> take(@PathVariable Long id, Authentication auth) {
        McqExam exam = mcqExamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MCQ exam", id));
        if (!Boolean.TRUE.equals(exam.getIsPublished())) {
            return ResponseEntity.badRequest().body(Map.of("message", "This exam is not yet published."));
        }
        User user = (User) auth.getPrincipal();
        Student student = user.getStudent();
        if (student != null && mcqSubmissionRepository.existsByMcqExamIdAndStudentId(id, student.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "You have already submitted this exam."));
        }
        List<Map<String, Object>> questions = exam.getQuestions().stream().map(q -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", q.getId());
            m.put("questionText", q.getQuestionText());
            m.put("optionA", q.getOptionA());
            m.put("optionB", q.getOptionB());
            m.put("optionC", q.getOptionC());
            m.put("optionD", q.getOptionD());
            m.put("marks", q.getMarks());
            return m;
        }).collect(Collectors.toList());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", exam.getId());
        res.put("title", exam.getTitle());
        res.put("durationMinutes", exam.getDurationMinutes());
        res.put("questions", questions);
        return ResponseEntity.ok(res);
    }

    // Faculty/Admin: create an MCQ exam by uploading a .docx or .pdf of pre-written questions.
    // The file is parsed automatically — no manual question entry needed.
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file,
                                     @RequestParam String title,
                                     @RequestParam Long moduleId,
                                     @RequestParam(defaultValue = "30") Integer durationMinutes,
                                     Authentication auth) {
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module", moduleId));
        CourseModuleController.assertFacultyOwnsCourse(auth, module.getCourse());

        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        String rawText;
        try {
            if (filename.endsWith(".docx")) {
                rawText = McqDocumentParser.extractTextFromDocx(file.getInputStream());
            } else if (filename.endsWith(".pdf")) {
                rawText = McqDocumentParser.extractTextFromPdf(file.getInputStream());
            } else {
                return ResponseEntity.badRequest().body(Map.of("message",
                        "Only .docx and .pdf files are supported."));
            }
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Could not read the uploaded file: " + e.getMessage()));
        }

        List<McqDocumentParser.ParsedQuestion> parsed = McqDocumentParser.parse(rawText);
        if (parsed.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "No valid questions could be parsed from this file. Please format each question as:\n" +
                    "1. Question text?\nA) Option\nB) Option\nC) Option\nD) Option\nAnswer: A"));
        }

        McqExam exam = new McqExam();
        exam.setTitle(title);
        exam.setModule(module);
        exam.setDurationMinutes(durationMinutes);
        exam.setIsPublished(false);
        boolean isFaculty = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));
        if (isFaculty) {
            User user = (User) auth.getPrincipal();
            exam.setCreatedBy(user.getFaculty());
        }
        McqExam savedExam = mcqExamRepository.save(exam);

        List<McqQuestion> questions = McqDocumentParser.toEntities(parsed);
        for (McqQuestion q : questions) {
            q.setMcqExam(savedExam);
        }
        mcqQuestionRepository.saveAll(questions);
        savedExam.setQuestions(questions);

        return ResponseEntity.status(201).body(Map.of(
                "exam", savedExam,
                "questionsImported", questions.size()
        ));
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<?> publish(@PathVariable Long id, Authentication auth) {
        McqExam exam = mcqExamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MCQ exam", id));
        CourseModuleController.assertFacultyOwnsCourse(auth, exam.getModule().getCourse());
        exam.setIsPublished(true);
        return ResponseEntity.ok(mcqExamRepository.save(exam));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        McqExam exam = mcqExamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MCQ exam", id));
        CourseModuleController.assertFacultyOwnsCourse(auth, exam.getModule().getCourse());
        mcqExamRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "MCQ exam deleted"));
    }

    // ── Student: submit answers, auto-evaluated instantly ──────────
    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submit(@PathVariable Long id, @RequestBody Map<String, String> answers,
                                     Authentication auth) {
        McqExam exam = mcqExamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MCQ exam", id));
        if (!Boolean.TRUE.equals(exam.getIsPublished())) {
            return ResponseEntity.badRequest().body(Map.of("message", "This exam is not published."));
        }
        User user = (User) auth.getPrincipal();
        Student student = user.getStudent();
        if (student == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No student profile linked to this account"));
        }
        if (mcqSubmissionRepository.existsByMcqExamIdAndStudentId(id, student.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "You have already submitted this exam."));
        }

        List<McqQuestion> questions = mcqQuestionRepository.findByMcqExamIdOrderByOrderIndexAsc(id);

        McqSubmission submission = new McqSubmission();
        submission.setMcqExam(exam);
        submission.setStudent(student);

        double score = 0;
        double total = 0;
        List<McqAnswer> answerEntities = new ArrayList<>();
        List<Map<String, Object>> review = new ArrayList<>();

        for (McqQuestion q : questions) {
            total += q.getMarks();
            String selectedStr = answers.get(String.valueOf(q.getId()));
            McqQuestion.Option selected = null;
            boolean correct = false;
            if (selectedStr != null && !selectedStr.isBlank()) {
                try {
                    selected = McqQuestion.Option.valueOf(selectedStr.trim().toUpperCase());
                    correct = selected == q.getCorrectOption();
                } catch (IllegalArgumentException ignored) { /* invalid option string — treat as unanswered */ }
            }
            if (correct) score += q.getMarks();

            McqAnswer answer = new McqAnswer();
            answer.setSubmission(submission);
            answer.setQuestion(q);
            answer.setSelectedOption(selected);
            answer.setIsCorrect(correct);
            answerEntities.add(answer);

            Map<String, Object> r = new LinkedHashMap<>();
            r.put("questionId", q.getId());
            r.put("questionText", q.getQuestionText());
            r.put("selectedOption", selected);
            r.put("correctOption", q.getCorrectOption());
            r.put("isCorrect", correct);
            r.put("marks", q.getMarks());
            review.add(r);
        }

        submission.setScore(score);
        submission.setTotalMarks(total);
        McqSubmission savedSubmission = mcqSubmissionRepository.save(submission);
        answerEntities.forEach(a -> a.setSubmission(savedSubmission));
        mcqAnswerRepository.saveAll(answerEntities);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("score", score);
        result.put("totalMarks", total);
        result.put("percentage", total > 0 ? Math.round((score / total) * 10000) / 100.0 : 0);
        result.put("review", review);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/my-result")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> myResult(@PathVariable Long id, Authentication auth) {
        User user = (User) auth.getPrincipal();
        Student student = user.getStudent();
        if (student == null) return ResponseEntity.ok(Map.of());
        return mcqSubmissionRepository.findByMcqExamIdAndStudentId(id, student.getId())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of()));
    }

    @GetMapping("/{id}/submissions")
    @PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
    public ResponseEntity<?> submissions(@PathVariable Long id, Authentication auth) {
        McqExam exam = mcqExamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("MCQ exam", id));
        CourseModuleController.assertFacultyOwnsCourse(auth, exam.getModule().getCourse());
        return ResponseEntity.ok(mcqSubmissionRepository.findByMcqExamIdOrderByScoreDesc(id));
    }
}
