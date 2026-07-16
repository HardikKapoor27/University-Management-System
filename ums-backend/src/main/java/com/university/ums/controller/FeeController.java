package com.university.ums.controller;

import com.university.ums.entity.*;
import com.university.ums.exception.ResourceNotFoundException;
import com.university.ums.repository.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/fees")
@RequiredArgsConstructor
public class FeeController {

    private final FeeStructureRepository feeStructureRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final StudentRepository studentRepository;
    private final FeeReminderRepository feeReminderRepository;

    // ── Fee structures ──────────────────────────────────────────────
    @GetMapping("/structures")
    public List<FeeStructure> getStructures() {
        return feeStructureRepository.findAllByOrderByAcademicYearDescSemesterAsc();
    }

    @PostMapping("/structures")
    @PreAuthorize("hasAnyRole('ACCOUNTS','ADMIN')")
    public ResponseEntity<?> createStructure(@Valid @RequestBody FeeStructure structure) {
        structure.setId(null);
        return ResponseEntity.status(201).body(feeStructureRepository.save(structure));
    }

    @DeleteMapping("/structures/{id}")
    @PreAuthorize("hasAnyRole('ACCOUNTS','ADMIN')")
    public ResponseEntity<?> deleteStructure(@PathVariable Long id) {
        if (!feeStructureRepository.existsById(id)) throw new ResourceNotFoundException("Fee structure", id);
        feeStructureRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Fee structure deleted"));
    }

    // ── Invoices ────────────────────────────────────────────────────
    @GetMapping("/invoices")
    @PreAuthorize("hasAnyRole('ACCOUNTS','ADMIN')")
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/invoices/student/{studentId}")
    public ResponseEntity<?> getStudentInvoices(@PathVariable Long studentId, Authentication auth) {
        boolean isOwnStudent = false;
        User user = (User) auth.getPrincipal();
        if (user.getStudent() != null) isOwnStudent = user.getStudent().getId().equals(studentId);
        boolean isStaff = auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ACCOUNTS") || a.getAuthority().equals("ROLE_ADMIN"));
        if (!isOwnStudent && !isStaff) {
            return ResponseEntity.status(403).body(Map.of("message", "Not authorized to view these invoices"));
        }
        return ResponseEntity.ok(invoiceRepository.findByStudentIdOrderByCreatedAtDesc(studentId));
    }

    @PostMapping("/invoices")
    @PreAuthorize("hasAnyRole('ACCOUNTS','ADMIN')")
    public ResponseEntity<?> createInvoice(@RequestBody Map<String, Object> body) {
        Long studentId = Long.valueOf(body.get("studentId").toString());
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        Invoice invoice = new Invoice();
        invoice.setStudent(student);
        invoice.setInvoiceNumber(generateInvoiceNumber());
        invoice.setAmountDue(Double.valueOf(body.get("amountDue").toString()));
        invoice.setAmountPaid(0.0);
        invoice.setAcademicYear(body.getOrDefault("academicYear", Year.now() + "-" + (Year.now().getValue() + 1)).toString());
        if (body.get("semester") != null) invoice.setSemester(Integer.valueOf(body.get("semester").toString()));
        if (body.get("dueDate") != null) invoice.setDueDate(LocalDate.parse(body.get("dueDate").toString()));
        if (body.get("feeStructureId") != null) {
            Long fsId = Long.valueOf(body.get("feeStructureId").toString());
            feeStructureRepository.findById(fsId).ifPresent(invoice::setFeeStructure);
        }
        invoice.setStatus(Invoice.Status.PENDING);
        return ResponseEntity.status(201).body(invoiceRepository.save(invoice));
    }

    @GetMapping("/invoices/{id}/payments")
    public ResponseEntity<?> getPayments(@PathVariable Long id, Authentication auth) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        User user = (User) auth.getPrincipal();
        boolean isOwnStudent = user.getStudent() != null && user.getStudent().getId().equals(invoice.getStudent().getId());
        boolean isStaff = auth.getAuthorities().stream().anyMatch(a ->
                a.getAuthority().equals("ROLE_ACCOUNTS") || a.getAuthority().equals("ROLE_ADMIN"));
        if (!isOwnStudent && !isStaff) {
            return ResponseEntity.status(403).body(Map.of("message", "Not authorized"));
        }
        return ResponseEntity.ok(paymentRepository.findByInvoiceIdOrderByCreatedAtDesc(id));
    }

    @PostMapping("/invoices/{id}/payments")
    @PreAuthorize("hasAnyRole('ACCOUNTS','ADMIN')")
    public ResponseEntity<?> recordPayment(@PathVariable Long id, @RequestBody Map<String, Object> body,
                                            Authentication auth) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));

        double amount = Double.parseDouble(body.get("amount").toString());
        if (amount <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Payment amount must be positive"));
        }

        Payment payment = new Payment();
        payment.setInvoice(invoice);
        payment.setAmount(amount);
        payment.setReceiptNumber(generateReceiptNumber());
        payment.setPaymentDate(body.get("paymentDate") != null
                ? LocalDate.parse(body.get("paymentDate").toString()) : LocalDate.now());
        if (body.get("method") != null) {
            payment.setMethod(Payment.Method.valueOf(body.get("method").toString().toUpperCase()));
        }
        payment.setTransactionRef(body.get("transactionRef") != null ? body.get("transactionRef").toString() : null);
        payment.setReceivedBy(auth.getName());
        paymentRepository.save(payment);

        invoice.setAmountPaid(invoice.getAmountPaid() + amount);
        if (invoice.getAmountPaid() >= invoice.getAmountDue()) {
            invoice.setStatus(Invoice.Status.PAID);
        } else if (invoice.getAmountPaid() > 0) {
            invoice.setStatus(Invoice.Status.PARTIAL);
        }
        invoiceRepository.save(invoice);

        return ResponseEntity.status(201).body(Map.of("payment", payment, "invoice", invoice));
    }

    // ── Fee Reminders (Accounts/Admin nudge a specific student) ────
    @PostMapping("/invoices/{id}/remind")
    @PreAuthorize("hasAnyRole('ACCOUNTS','ADMIN')")
    public ResponseEntity<?> sendReminder(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body,
                                           Authentication auth) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", id));
        if (invoice.getStatus() == Invoice.Status.PAID) {
            return ResponseEntity.badRequest().body(Map.of("message", "This invoice is already fully paid."));
        }
        double remaining = invoice.getAmountDue() - invoice.getAmountPaid();
        String customMessage = body != null ? body.get("message") : null;
        String message = (customMessage != null && !customMessage.isBlank())
                ? customMessage.trim()
                : String.format("Reminder: ₹%.2f is due on invoice %s%s. Please clear your balance of ₹%.2f at the earliest.",
                    invoice.getAmountDue(), invoice.getInvoiceNumber(),
                    invoice.getDueDate() != null ? " by " + invoice.getDueDate() : "",
                    remaining);

        FeeReminder reminder = new FeeReminder();
        reminder.setInvoice(invoice);
        reminder.setStudent(invoice.getStudent());
        reminder.setMessage(message);
        reminder.setSentBy(auth.getName());
        reminder.setIsRead(false);
        return ResponseEntity.status(201).body(feeReminderRepository.save(reminder));
    }

    @GetMapping("/reminders/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> myReminders(Authentication auth) {
        User user = (User) auth.getPrincipal();
        if (user.getStudent() == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(feeReminderRepository.findByStudentIdOrderBySentAtDesc(user.getStudent().getId()));
    }

    @GetMapping("/reminders/unread-count")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> unreadReminderCount(Authentication auth) {
        User user = (User) auth.getPrincipal();
        if (user.getStudent() == null) return ResponseEntity.ok(Map.of("count", 0));
        return ResponseEntity.ok(Map.of("count", feeReminderRepository.countByStudentIdAndIsReadFalse(user.getStudent().getId())));
    }

    @PatchMapping("/reminders/{id}/read")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> markReminderRead(@PathVariable Long id, Authentication auth) {
        FeeReminder reminder = feeReminderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder", id));
        User user = (User) auth.getPrincipal();
        if (user.getStudent() == null || !reminder.getStudent().getId().equals(user.getStudent().getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Not authorized"));
        }
        reminder.setIsRead(true);
        return ResponseEntity.ok(feeReminderRepository.save(reminder));
    }

    @GetMapping("/reminders/student/{studentId}")
    @PreAuthorize("hasAnyRole('ACCOUNTS','ADMIN')")
    public List<FeeReminder> reminderHistory(@PathVariable Long studentId) {
        return feeReminderRepository.findByStudentIdOrderBySentAtDesc(studentId);
    }

    @GetMapping("/dues-summary")
    @PreAuthorize("hasAnyRole('ACCOUNTS','ADMIN')")
    public ResponseEntity<?> duesSummary() {
        List<Invoice> all = invoiceRepository.findAllByOrderByCreatedAtDesc();
        double totalDue = all.stream().mapToDouble(Invoice::getAmountDue).sum();
        double totalPaid = all.stream().mapToDouble(Invoice::getAmountPaid).sum();
        long pendingCount = invoiceRepository.countByStatus(Invoice.Status.PENDING);
        long partialCount = invoiceRepository.countByStatus(Invoice.Status.PARTIAL);
        long paidCount = invoiceRepository.countByStatus(Invoice.Status.PAID);
        return ResponseEntity.ok(Map.of(
                "totalInvoices", all.size(),
                "totalDue", totalDue,
                "totalCollected", totalPaid,
                "totalOutstanding", totalDue - totalPaid,
                "pendingCount", pendingCount,
                "partialCount", partialCount,
                "paidCount", paidCount
        ));
    }

    private static final AtomicLong invoiceSeq = new AtomicLong(1);
    private static final AtomicLong receiptSeq = new AtomicLong(1);

    private String generateInvoiceNumber() {
        return "INV-" + Year.now() + "-" + String.format("%05d", invoiceRepository.count() + invoiceSeq.getAndIncrement());
    }

    private String generateReceiptNumber() {
        return "RCPT-" + Year.now() + "-" + String.format("%05d", paymentRepository.count() + receiptSeq.getAndIncrement());
    }
}
