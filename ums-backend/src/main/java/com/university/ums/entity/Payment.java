package com.university.ums.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@ToString(exclude = {"invoice"})
public class Payment {

    public enum Method {
        CASH, CARD, UPI, BANK_TRANSFER, ONLINE, CHEQUE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String receiptNumber; // e.g. "RCPT-2026-000123"

    @Column(nullable = false)
    private Double amount;

    private LocalDate paymentDate;

    @Enumerated(EnumType.STRING)
    private Method method = Method.CASH;

    private String transactionRef; // for UPI/card/bank transfer

    private String receivedBy; // username of the accounts staff who recorded it

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    @JsonIgnoreProperties({"payments", "student", "feeStructure"})
    private Invoice invoice;
}
