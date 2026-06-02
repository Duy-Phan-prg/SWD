package com.sba301.cinemaai.entity;

import com.sba301.cinemaai.enums.BookingStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "bookings",
        indexes = {
                @Index(name = "idx_bookings_user", columnList = "user_id"),
                @Index(name = "idx_bookings_showtime", columnList = "showtime_id"),
                @Index(name = "idx_bookings_status", columnList = "status")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Booking extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_code", nullable = false, unique = true, length = 50)
    private String bookingCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private BookingStatus status = BookingStatus.HOLDING;

    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "checked_in_at")
    private LocalDateTime checkedInAt;

    @Column(name = "refund_requested_at")
    private LocalDateTime refundRequestedAt;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "refund_reason", length = 500)
    private String refundReason;

    @Column(name = "qr_code", length = 500)
    private String qrCode;

    public Booking(String bookingCode, User user, Showtime showtime, LocalDateTime holdExpiresAt) {
        this.bookingCode = bookingCode;
        this.user = user;
        this.showtime = showtime;
        this.holdExpiresAt = holdExpiresAt;
    }

    public void updateAmounts(BigDecimal subtotal, BigDecimal discountAmount, BigDecimal totalAmount) {
        this.subtotal = subtotal;
        this.discountAmount = discountAmount;
        this.totalAmount = totalAmount;
    }

    public void markPendingPayment() {
        this.status = BookingStatus.PENDING_PAYMENT;
    }

    public void markPaid(String qrCode) {
        this.qrCode = qrCode;
        this.paidAt = LocalDateTime.now();
        this.status = BookingStatus.PAID;
    }

    public void cancel() {
        this.cancelledAt = LocalDateTime.now();
        this.status = BookingStatus.CANCELLED;
    }

    public void expire() {
        this.status = BookingStatus.EXPIRED;
    }

    public void checkIn() {
        this.checkedInAt = LocalDateTime.now();
        this.status = BookingStatus.USED;
    }

    public void requestRefund(String reason) {
        this.refundRequestedAt = LocalDateTime.now();
        this.refundReason = reason;
        this.status = BookingStatus.REFUND_REQUESTED;
    }

    public void markRefunded() {
        this.refundedAt = LocalDateTime.now();
        this.status = BookingStatus.REFUNDED;
    }
}
