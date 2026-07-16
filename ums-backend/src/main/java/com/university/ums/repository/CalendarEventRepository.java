package com.university.ums.repository;

import com.university.ums.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findAllByOrderByEventDateAsc();
    List<CalendarEvent> findByEventDateBetweenOrderByEventDateAsc(LocalDate start, LocalDate end);
    List<CalendarEvent> findByEventDateGreaterThanEqualOrderByEventDateAsc(LocalDate from);
}
