package com.sba301.cinemaai.mapper;

import com.sba301.cinemaai.dto.booking.BookingFoodResponse;
import com.sba301.cinemaai.dto.booking.BookingResponse;
import com.sba301.cinemaai.dto.booking.BookingSeatResponse;
import com.sba301.cinemaai.dto.booking.BookingTicketResponse;
import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.BookingFoodItem;
import com.sba301.cinemaai.entity.BookingSeat;
import com.sba301.cinemaai.entity.BookingTicket;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class BookingMapper {

    public BookingResponse toResponse(
            Booking booking,
            List<BookingSeat> seats,
            List<BookingTicket> tickets,
            List<BookingFoodItem> foods
    ) {
        return new BookingResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getUser().getId(),
                booking.getShowtime().getId(),
                booking.getShowtime().getMovie().getTitle(),
                booking.getShowtime().getRoom().getName(),
                booking.getShowtime().getRoom().getCinema().getName(),
                booking.getShowtime().getStartTime(),
                booking.getStatus(),
                booking.getSubtotal(),
                booking.getDiscountAmount(),
                booking.getTotalAmount(),
                booking.getHoldExpiresAt(),
                booking.getPaidAt(),
                booking.getCancelledAt(),
                booking.getCheckedInAt(),
                booking.getRefundRequestedAt(),
                booking.getRefundedAt(),
                booking.getRefundReason(),
                booking.getQrCode(),
                seats.stream().map(this::toSeatResponse).toList(),
                tickets.stream().map(this::toTicketResponse).toList(),
                foods.stream().map(this::toFoodResponse).toList()
        );
    }

    private BookingSeatResponse toSeatResponse(BookingSeat bookingSeat) {
        return new BookingSeatResponse(
                bookingSeat.getSeat().getId(),
                bookingSeat.getSeat().getRowLabel(),
                bookingSeat.getSeat().getSeatNumber(),
                bookingSeat.getUnitPrice(),
                bookingSeat.getStatus()
        );
    }

    private BookingFoodResponse toFoodResponse(BookingFoodItem item) {
        String name = item.getFoodItem() != null ? item.getFoodItem().getName() : item.getFoodCombo().getName();
        Long foodItemId = item.getFoodItem() == null ? null : item.getFoodItem().getId();
        Long foodComboId = item.getFoodCombo() == null ? null : item.getFoodCombo().getId();
        return new BookingFoodResponse(
                foodItemId,
                foodComboId,
                name,
                item.getQuantity(),
                item.getUnitPrice(),
                item.getUnitPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity()))
        );
    }

    private BookingTicketResponse toTicketResponse(BookingTicket ticket) {
        return new BookingTicketResponse(
                ticket.getTicketType(),
                ticket.getViewerAge(),
                ticket.getQuantity(),
                ticket.getUnitPrice(),
                ticket.getLineTotal()
        );
    }
}
