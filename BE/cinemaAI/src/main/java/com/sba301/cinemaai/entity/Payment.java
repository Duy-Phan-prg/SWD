package com.sba301.cinemaai.entity;

import com.sba301.cinemaai.enums.PaymentProvider;
import com.sba301.cinemaai.enums.PaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "payments")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentProvider provider;

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "callback_payload", columnDefinition = "TEXT")
    private String callbackPayload;

    public Payment(Booking booking, PaymentProvider provider, BigDecimal amount) {
        this.booking = booking;
        this.provider = provider;
        this.amount = amount;
    }

    public void markSuccess(String transactionId, String callbackPayload) {
        this.transactionId = transactionId;
        this.callbackPayload = callbackPayload;
        this.paidAt = LocalDateTime.now();
        this.status = PaymentStatus.SUCCESS;
    }

    public void markFailed(String callbackPayload) {
        this.callbackPayload = callbackPayload;
        this.status = PaymentStatus.FAILED;
    }

    public void refund() {
        this.status = PaymentStatus.REFUNDED;
    }
}
