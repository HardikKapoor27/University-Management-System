package com.university.ums.dto.request;

import com.university.ums.entity.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RegisterRequest(
    @NotBlank String username,
    @NotBlank String password,
    @NotNull  User.Role role,
    Long studentId,   // provide if role = STUDENT
    Long facultyId    // provide if role = FACULTY
) {}
