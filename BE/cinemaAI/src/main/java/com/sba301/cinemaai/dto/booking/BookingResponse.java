package com.sba301.cinemaai.dto.booking;

import com.sba301.cinemaai.enums.BookingStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record BookingResponse(
        Long id,
        String bookingCode,
        Long userId,
        Long showtimeId,
        String movieTitle,
        String roomName,
        String cinemaName,
        LocalDateTime showtimeStart,
        BookingStatus status,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal totalAmount,
        LocalDateTime holdExpiresAt,
        LocalDateTime paidAt,
        LocalDateTime cancelledAt,
        LocalDateTime checkedInAt,
        LocalDateTime refundRequestedAt,
        LocalDateTime refundedAt,
        String refundReason,
        String qrCode,
        List<BookingSeatResponse> seats,
        List<BookingTicketResponse> tickets,
        List<BookingFoodResponse> foods
) {
}
