package com.sba301.cinemaai.service.impl;

import com.sba301.cinemaai.dto.response.refund.BulkRefundResponse;
import com.sba301.cinemaai.dto.response.refund.VnpRefundResponse;
import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.Payment;
import com.sba301.cinemaai.entity.Showtime;
import com.sba301.cinemaai.enums.BookingStatus;
import com.sba301.cinemaai.enums.PaymentProvider;
import com.sba301.cinemaai.enums.PaymentStatus;
import com.sba301.cinemaai.enums.SeatRuntimeStatus;
import com.sba301.cinemaai.repository.BookingRepository;
import com.sba301.cinemaai.repository.BookingSeatRepository;
import com.sba301.cinemaai.repository.PaymentRepository;
import com.sba301.cinemaai.service.BulkRefundService;
import com.sba301.cinemaai.service.LoyaltyPointService;
import com.sba301.cinemaai.service.NotificationService;
import com.sba301.cinemaai.service.VNPayService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BulkRefundServiceImpl implements BulkRefundService {

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final PaymentRepository paymentRepository;
    private final LoyaltyPointService loyaltyPointService;
    private final NotificationService notificationService;
    private final VNPayService vnpayService;

    @Value("${cinema.bulk-refund.retry-max-attempts:3}")
    private int retryMaxAttempts;

    @Override
    @Transactional
    public BulkRefundResponse processBulkRefund(Showtime showtime, String reason) {
        String refundReason = buildRefundReason(reason);
        List<Booking> bookings = bookingRepository.findByShowtimeIdAndStatusForUpdate(showtime.getId(), BookingStatus.PAID);
        int successCount = 0;
        int failedCount = 0;
        int pendingCount = 0;

        for (Booking booking : bookings) {
            booking.setStatus(BookingStatus.REFUND_REQUESTED);
            booking.setRefundRequestedAt(LocalDateTime.now());
            booking.setRefundReason(refundReason);
            booking.setBulkRefund(true);
            booking.setRefundRetryAttempts(0);
            booking.setLastRefundAttemptAt(LocalDateTime.now());
            bookingRepository.save(booking);

            RefundOutcome outcome = processRefundAttempt(booking);
            if (outcome.success()) {
                notificationService.notifyShowtimeCancelled(booking.getUser(), booking, showtime);
                successCount++;
            } else if (outcome.retryable()) {
                pendingCount++;
            } else {
                failedCount++;
            }
        }

        return new BulkRefundResponse(
                showtime.getId(),
                bookings.size(),
                successCount,
                failedCount,
                pendingCount,
                pendingCount > 0 ? "PROCESSING" : "COMPLETED",
                pendingCount > 0 ? "2-5 minutes" : "Completed"
        );
    }

    @Override
    @Transactional
    public int retryPendingRefunds() {
        List<Booking> pendingBookings = bookingRepository
                .findTop50ByStatusAndBulkRefundTrueOrderByRefundRequestedAtAsc(BookingStatus.REFUND_REQUESTED);
        int processed = 0;
        for (Booking booking : pendingBookings) {
            if (booking.getRefundRetryAttempts() >= retryMaxAttempts) {
                Payment payment = paymentRepository.findByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS)
                        .orElse(null);
                markRefundFailed(booking, payment, "Retry attempts exceeded");
                processed++;
                continue;
            }
            RefundOutcome outcome = processRefundAttempt(booking);
            if (!outcome.retryable() || outcome.success()) {
                processed++;
            }
        }
        return processed;
    }

    private RefundOutcome processRefundAttempt(Booking booking) {
        Payment payment = paymentRepository.findByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS)
                .orElse(null);
        if (payment == null) {
            markRefundFailed(booking, null, "Payment SUCCESS not found");
            return new RefundOutcome(false, false);
        }

        booking.setLastRefundAttemptAt(LocalDateTime.now());
        RefundAttempt attempt = attemptProviderRefund(payment, booking);
        if (attempt.success()) {
            completeSuccessfulRefund(booking, payment, attempt.refundTransactionNo(), attempt.refundMethod());
            return new RefundOutcome(true, false);
        }
        if (attempt.retryable() && booking.getRefundRetryAttempts() + 1 < retryMaxAttempts) {
            booking.setRefundRetryAttempts(booking.getRefundRetryAttempts() + 1);
            bookingRepository.save(booking);
            log.warn("Refund retry pending for booking {} responseCode={} attempt={}/{}",
                    booking.getBookingCode(), attempt.responseCode(), booking.getRefundRetryAttempts(), retryMaxAttempts);
            return new RefundOutcome(false, true);
        }

        markRefundFailed(booking, payment, "VNPay error code: " + attempt.responseCode());
        return new RefundOutcome(false, false);
    }

    private RefundAttempt attemptProviderRefund(Payment payment, Booking booking) {
        if (payment.getProvider() == PaymentProvider.MOCK) {
            return new RefundAttempt(true, false, "00", "MOCK-REFUND-" + System.currentTimeMillis(), "MOCK");
        }
        if (payment.getProvider() != PaymentProvider.VNPAY) {
            return new RefundAttempt(false, false, "UNSUPPORTED_PROVIDER", null, null);
        }

        try {
            VnpRefundResponse response = vnpayService.requestRefund(payment, booking.getTotalAmount());
            String code = response.getResponseCode();
            boolean success = "00".equals(code);
            boolean retryable = isRetryable(code);
            return new RefundAttempt(success, retryable, code, response.getRefundTransactionNo(), "VNPAY");
        } catch (Exception exception) {
            log.error("Error calling refund provider for booking {}", booking.getBookingCode(), exception);
            return new RefundAttempt(false, true, "NETWORK_ERROR", null, null);
        }
    }

    private boolean isRetryable(String code) {
        return code == null || "NETWORK_ERROR".equals(code) || "TIMEOUT".equals(code) || "50".equals(code) || "51".equals(code);
    }

    private void completeSuccessfulRefund(Booking booking, Payment payment, String refundTransactionNo, String refundMethod) {
        loyaltyPointService.restoreRedeemedPointsFromBooking(booking.getUser(), booking);
        loyaltyPointService.revokePointsFromBooking(booking.getUser(), booking);

        releaseSeats(booking);
        booking.setQrCode(null);
        booking.setStatus(BookingStatus.REFUNDED);
        booking.setRefundedAt(LocalDateTime.now());
        booking.setRefundMethod(refundMethod);
        bookingRepository.save(booking);

        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setRefundAmount(booking.getTotalAmount());
        payment.setRefundedAt(LocalDateTime.now());
        payment.setRefundTransactionNo(refundTransactionNo);
        payment.setRefundMethod(refundMethod);
        payment.setPaymentAccountLabel(null);
        payment.setCallbackPayload(null);
        paymentRepository.save(payment);
    }

    private void markRefundFailed(Booking booking, Payment payment, String failureReason) {
        booking.setStatus(BookingStatus.REFUND_FAILED);
        booking.setRefundReason(appendFailureReason(booking.getRefundReason(), failureReason));
        bookingRepository.save(booking);

        if (payment != null) {
            payment.setStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }
    }

    private void releaseSeats(Booking booking) {
        bookingSeatRepository.findByBooking(booking)
                .forEach(seat -> seat.setStatus(SeatRuntimeStatus.RELEASED));
    }

    private String buildRefundReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return "Showtime cancelled due to operational incident";
        }
        return "Huy suat chieu do su co: " + reason.trim();
    }

    private String appendFailureReason(String refundReason, String failureReason) {
        if (failureReason == null || failureReason.isBlank()) {
            return refundReason;
        }
        String prefix = refundReason == null || refundReason.isBlank() ? "" : refundReason + " | ";
        return (prefix + failureReason).substring(0, Math.min(500, (prefix + failureReason).length()));
    }

    private record RefundAttempt(
            boolean success,
            boolean retryable,
            String responseCode,
            String refundTransactionNo,
            String refundMethod
    ) {
    }

    private record RefundOutcome(boolean success, boolean retryable) {
    }
}
