package com.sba301.cinemaai.service.impl;

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
import com.sba301.cinemaai.service.LoyaltyPointService;
import com.sba301.cinemaai.service.MailService;
import com.sba301.cinemaai.service.NotificationService;
import com.sba301.cinemaai.service.RefundService;
import com.sba301.cinemaai.service.VNPayService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefundServiceImpl implements RefundService {

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final PaymentRepository paymentRepository;
    private final LoyaltyPointService loyaltyPointService;
    private final NotificationService notificationService;
    private final MailService mailService;
    private final VNPayService vnpayService;

    @Override
    @Transactional
    public void processShowtimeCancellation(Showtime showtime, String reason) {
        String refundReason = buildRefundReason(reason);

        bookingRepository.findByShowtime(showtime).forEach(booking -> {
            switch (booking.getStatus()) {
                case HOLDING, PENDING_PAYMENT -> {
                    cancelUnpaidBooking(booking);
                    notificationService.notifyBookingCancelled(booking);
                }
                case PAID, USED -> processPaidBookingRefund(booking, showtime, refundReason);
                default -> { /* terminal or in-progress refund — no action */ }
            }
        });
    }

    private void processPaidBookingRefund(Booking booking, Showtime showtime, String refundReason) {
        booking.setStatus(BookingStatus.REFUND_REQUESTED);
        booking.setRefundReason(refundReason);
        booking.setRefundRequestedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        Payment payment = paymentRepository.findByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS)
                .orElse(null);

        if (payment == null) {
            log.error("Payment SUCCESS not found for refundable booking: {}", booking.getBookingCode());
            markRefundFailed(booking, refundReason);
            return;
        }

        try {
            RefundAttempt attempt = attemptProviderRefund(payment, booking);
            if (attempt.success()) {
                completeSuccessfulRefund(
                        booking,
                        payment,
                        booking.getTotalAmount(),
                        attempt.refundTransactionNo(),
                        attempt.refundMethod()
                );
                notificationService.notifyShowtimeCancelled(booking.getUser(), booking, showtime);
            } else {
                markRefundFailed(booking, refundReason);
                log.warn("Refund failed for booking {} — responseCode={}",
                        booking.getBookingCode(), attempt.responseCode());
            }
        } catch (Exception exception) {
            log.error("Error processing refund for booking: {}", booking.getBookingCode(), exception);
            markRefundFailed(booking, refundReason);
        }
    }

    private void markRefundFailed(Booking booking, String refundReason) {
        booking.setStatus(BookingStatus.REFUND_FAILED);
        bookingRepository.save(booking);
        mailService.sendRefundFailedNotice(
                booking.getUser().getEmail(),
                booking.getBookingCode(),
                booking.getTotalAmount(),
                refundReason
        );
    }

    private RefundAttempt attemptProviderRefund(Payment payment, Booking booking) {
        if (payment.getProvider() == PaymentProvider.MOCK) {
            return new RefundAttempt(
                    true,
                    "00",
                    "MOCK-REFUND-" + System.currentTimeMillis(),
                    "MOCK"
            );
        }

        if (payment.getProvider() != PaymentProvider.VNPAY) {
            return new RefundAttempt(false, "UNSUPPORTED_PROVIDER", null, null);
        }

        // VNPay hoàn về đúng tài khoản/phương thức đã dùng khi thanh toán gốc.
        VnpRefundResponse response = vnpayService.requestRefund(payment, booking.getTotalAmount());
        boolean success = "00".equals(response.getResponseCode());
        return new RefundAttempt(
                success,
                response.getResponseCode(),
                response.getRefundTransactionNo(),
                "VNPAY"
        );
    }

    private void completeSuccessfulRefund(
            Booking booking,
            Payment payment,
            java.math.BigDecimal refundAmount,
            String refundTransactionNo,
            String refundMethod
    ) {
        loyaltyPointService.restoreRedeemedPointsFromBooking(booking.getUser(), booking);
        loyaltyPointService.revokePointsFromBooking(booking.getUser(), booking);

        releaseSeats(booking);
        booking.setQrCode(null);
        booking.setStatus(BookingStatus.REFUNDED);
        booking.setRefundedAt(LocalDateTime.now());
        bookingRepository.save(booking);

        if (payment != null) {
            payment.setStatus(PaymentStatus.REFUNDED);
            payment.setRefundAmount(refundAmount);
            payment.setRefundedAt(LocalDateTime.now());
            payment.setRefundTransactionNo(refundTransactionNo);
            payment.setRefundMethod(refundMethod);
            payment.setPaymentAccountLabel(null);
            payment.setCallbackPayload(null);
            paymentRepository.save(payment);
        }
    }

    private void cancelUnpaidBooking(Booking booking) {
        releaseSeats(booking);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setStatus(BookingStatus.CANCELLED);
    }

    private void releaseSeats(Booking booking) {
        bookingSeatRepository.findByBooking(booking)
                .forEach(seat -> seat.setStatus(SeatRuntimeStatus.RELEASED));
    }

    private String buildRefundReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return "Showtime cancelled due to operational incident";
        }
        return "Hủy suất chiếu do sự cố: " + reason.trim();
    }

    private record RefundAttempt(
            boolean success,
            String responseCode,
            String refundTransactionNo,
            String refundMethod
    ) {
    }
}
