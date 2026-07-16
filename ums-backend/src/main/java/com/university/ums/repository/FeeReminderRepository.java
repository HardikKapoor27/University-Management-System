package com.university.ums.repository;

import com.university.ums.entity.FeeReminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeeReminderRepository extends JpaRepository<FeeReminder, Long> {
    List<FeeReminder> findByStudentIdOrderBySentAtDesc(Long studentId);
    List<FeeReminder> findByInvoiceIdOrderBySentAtDesc(Long invoiceId);
    long countByStudentIdAndIsReadFalse(Long studentId);
}
