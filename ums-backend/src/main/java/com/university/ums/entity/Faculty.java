package com.university.ums.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "faculty")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@ToString(exclude = {"department", "courses", "attendances"})
public class Faculty {

    public enum Designation {
        PROFESSOR, ASSOCIATE_PROFESSOR, ASSISTANT_PROFESSOR, LECTURER, VISITING
    }

    public enum Status {
        ACTIVE, INACTIVE, ON_LEAVE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String employeeId; // e.g. "FAC-2024-001"

    @NotBlank
    private String name;

    @Email
    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Designation designation;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    private String qualification; // e.g. "Ph.D Computer Science"
    private String specialization;

    // If true, this faculty can mark attendance (acts as mentor/class teacher)
    private Boolean isMentor = false;

    private LocalDate joiningDate;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @JsonIgnore
    @OneToMany(mappedBy = "faculty", fetch = FetchType.LAZY)
    private List<Course> courses = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "markedBy", fetch = FetchType.LAZY)
    private List<Attendance> attendances = new ArrayList<>();

    @JsonIgnore
    @OneToOne(mappedBy = "faculty", fetch = FetchType.LAZY)
    private User user;
}
