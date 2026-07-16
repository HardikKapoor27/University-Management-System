package com.university.ums.repository;

import com.university.ums.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<Invoice> findAllByOrderByCreatedAtDesc();
    List<Invoice> findByStatusOrderByDueDateAsc(Invoice.Status status);
    long countByStatus(Invoice.Status status);
}
