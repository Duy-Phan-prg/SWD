package com.sba301.cinemaai.service.impl;

import com.sba301.cinemaai.dto.request.refund.ConfirmManualRefundRequest;
import com.sba301.cinemaai.dto.response.PageResponse;
import com.sba301.cinemaai.dto.response.refund.BulkRefundDetailResponse;
import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.Payment;
import com.sba301.cinemaai.enums.BookingStatus;
import com.sba301.cinemaai.enums.LoyaltyPointType;
import com.sba301.cinemaai.enums.PaymentStatus;
import com.sba301.cinemaai.enums.SeatRuntimeStatus;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.repository.BookingRepository;
import com.sba301.cinemaai.repository.BookingSeatRepository;
import com.sba301.cinemaai.repository.LoyaltyPointTransactionRepository;
import com.sba301.cinemaai.repository.PaymentRepository;
import com.sba301.cinemaai.service.LoyaltyPointService;
import com.sba301.cinemaai.service.StaffBulkRefundService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StaffBulkRefundServiceImpl implements StaffBulkRefundService {

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final PaymentRepository paymentRepository;
    private final LoyaltyPointTransactionRepository loyaltyPointTransactionRepository;
    private final LoyaltyPointService loyaltyPointService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BulkRefundDetailResponse> getFailedRefundsList(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100)));
        Page<BulkRefundDetailResponse> result = bookingRepository
                .findByStatusAndBulkRefundTrue(BookingStatus.REFUND_FAILED, pageable)
                .map(this::toDetailResponse);
        return PageResponse.from(result);
    }

    @Override
    @Transactional(readOnly = true)
    public BulkRefundDetailResponse getRefundDetail(Long bookingId) {
        return toDetailResponse(findBooking(bookingId));
    }

    @Override
    @Transactional
    public BulkRefundDetailResponse confirmManualRefund(Long bookingId, ConfirmManualRefundRequest request) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        if (booking.getStatus() != BookingStatus.REFUND_FAILED) {
            throw new BadRequestException("Only REFUND_FAILED booking can be manually confirmed");
        }

        String method = normalizeMethod(request.refundMethod());
        loyaltyPointService.restoreRedeemedPointsFromBooking(booking.getUser(), booking);
        loyaltyPointService.revokePointsFromBooking(booking.getUser(), booking);

        releaseSeats(booking);
        booking.setQrCode(null);
        booking.setStatus(BookingStatus.REFUNDED);
        booking.setRefundedAt(LocalDateTime.now());
        booking.setRefundMethod(method);
        booking.setRefundReason(appendNotes(booking.getRefundReason(), request.notes()));
        bookingRepository.save(booking);

        Payment payment = paymentRepository.findByBooking(booking).stream()
                .findFirst()
                .orElse(null);
        if (payment != null) {
            payment.setStatus(PaymentStatus.REFUNDED);
            payment.setRefundAmount(booking.getTotalAmount());
            payment.setRefundedAt(LocalDateTime.now());
            payment.setRefundTransactionNo("MANUAL-" + booking.getId() + "-" + System.currentTimeMillis());
            payment.setRefundMethod(method);
            payment.setPaymentAccountLabel(null);
            payment.setCallbackPayload(null);
            paymentRepository.save(payment);
        }

        return toDetailResponse(booking);
    }

    private Booking findBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
    }

    private void releaseSeats(Booking booking) {
        bookingSeatRepository.findByBooking(booking)
                .forEach(seat -> seat.setStatus(SeatRuntimeStatus.RELEASED));
    }

    private BulkRefundDetailResponse toDetailResponse(Booking booking) {
        int restore = booking.getLoyaltyPointsRedeemed();
        int revoke = calculateEarnedPoints(booking);
        return new BulkRefundDetailResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getUser().getId(),
                booking.getUser().getFullName(),
                booking.getUser().getEmail(),
                booking.getShowtime().getMovie().getTitle(),
                booking.getShowtime().getStartTime(),
                booking.getShowtime().getRoom().getName(),
                booking.getTotalAmount(),
                new BulkRefundDetailResponse.LoyaltyCalculation(restore, revoke, restore - revoke),
                booking.getRefundReason(),
                booking.getRefundMethod(),
                booking.getRefundRequestedAt(),
                booking.getRefundedAt()
        );
    }

    private int calculateEarnedPoints(Booking booking) {
        if (booking.getId() == null) {
            return 0;
        }
        long earned = loyaltyPointTransactionRepository.sumDeltaByBookingAndType(booking.getId(), LoyaltyPointType.EARN);
        return earned > 0 ? Math.toIntExact(earned) : 0;
    }

    private String normalizeMethod(String method) {
        if ("CASH".equals(method)) {
            return "CASH";
        }
        return "MANUAL_BANK_TRANSFER";
    }

    private String appendNotes(String refundReason, String notes) {
        if (notes == null || notes.isBlank()) {
            return refundReason;
        }
        String value = (refundReason == null || refundReason.isBlank() ? "" : refundReason + " | ")
                + "Manual note: " + notes.trim();
        return value.substring(0, Math.min(500, value.length()));
    }
}
