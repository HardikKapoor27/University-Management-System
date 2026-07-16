package com.university.ums.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Defines how much a semester of a given (optionally department-specific)
 * program should cost. Invoices are generated against a FeeStructure.
 */
@Entity
@Table(name = "fee_structures")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@ToString(exclude = {"department"})
public class FeeStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String academicYear; // e.g. "2025-2026"

    @NotNull
    private Integer semester;

    @NotNull
    private Double totalAmount;

    private String description;

    // Null = applies to every department
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    @JsonIgnoreProperties({"faculty","courses","students","hod"})
    private Department department;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
