package com.university.ums.controller;

import com.university.ums.dto.request.LoginRequest;
import com.university.ums.dto.request.RegisterRequest;
import com.university.ums.entity.Faculty;
import com.university.ums.entity.Student;
import com.university.ums.entity.User;
import com.university.ums.exception.DuplicateResourceException;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.FacultyRepository;
import com.university.ums.repository.StudentRepository;
import com.university.ums.repository.UserRepository;
import com.university.ums.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.username(), req.password()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(req.username());
        String token = jwtService.generateToken(userDetails);

        User user = userRepository.findByUsername(req.username()).orElseThrow();

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("userId", user.getId());

        // Include linked profile ID so frontend knows which student/faculty profile to load
        if (user.getStudent() != null) {
            response.put("profileId", user.getStudent().getId());
            response.put("profileName", user.getStudent().getName());
        } else if (user.getFaculty() != null) {
            response.put("profileId", user.getFaculty().getId());
            response.put("profileName", user.getFaculty().getName());
            response.put("isMentor", user.getFaculty().getIsMentor());
        }

        return ResponseEntity.ok(response);
    }

    // Get current user's own profile — works for all roles
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getMyProfile(Authentication auth) {
        User user = (User) auth.getPrincipal();
        Map<String, Object> response = new HashMap<>();
        response.put("userId", user.getId());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());

        if (user.getStudent() != null) {
            Student s = user.getStudent();
            response.put("profileId", s.getId());
            response.put("name", s.getName());
            response.put("email", s.getEmail());
            response.put("rollNumber", s.getRollNumber());
            response.put("semester", s.getSemester());
            response.put("department", s.getDepartment() != null ? s.getDepartment().getName() : null);
            response.put("status", s.getStatus());
        } else if (user.getFaculty() != null) {
            Faculty f = user.getFaculty();
            response.put("profileId", f.getId());
            response.put("name", f.getName());
            response.put("email", f.getEmail());
            response.put("employeeId", f.getEmployeeId());
            response.put("designation", f.getDesignation());
            response.put("department", f.getDepartment() != null ? f.getDepartment().getName() : null);
            response.put("isMentor", f.getIsMentor());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByUsername(req.username())) {
            throw new DuplicateResourceException("Username already taken: " + req.username());
        }

        User user = new User();
        user.setUsername(req.username());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRole(req.role());

        if (req.role() == User.Role.STUDENT && req.studentId() != null) {
            Student student = studentRepository.findById(req.studentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student", req.studentId()));
            user.setStudent(student);
        }

        if (req.role() == User.Role.FACULTY && req.facultyId() != null) {
            Faculty faculty = facultyRepository.findById(req.facultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", req.facultyId()));
            user.setFaculty(faculty);
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
    }
}
