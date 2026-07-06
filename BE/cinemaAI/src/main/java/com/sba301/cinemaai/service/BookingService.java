package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.booking.CreateBookingRequest;
import com.sba301.cinemaai.dto.request.booking.HoldSeatsRequest;
import com.sba301.cinemaai.dto.response.PageResponse;
import com.sba301.cinemaai.dto.response.booking.BookingResponse;
import com.sba301.cinemaai.enums.BookingStatus;
import java.util.List;

public interface BookingService {

    BookingResponse holdSeats(String email, HoldSeatsRequest request);

    BookingResponse createBooking(String email, CreateBookingRequest request);

    PageResponse<BookingResponse> getMyBookings(String email, int page, int size);

    PageResponse<BookingResponse> getAdminBookings(BookingStatus status, int page, int size);

    BookingResponse getMyBooking(String email, Long bookingId);

    BookingResponse getAdminBooking(Long bookingId);

    BookingResponse cancel(String email, Long bookingId);

    BookingResponse requestRefund(String email, Long bookingId, String reason);

    BookingResponse requestRefundAdmin(Long bookingId, String reason);

    BookingResponse markRefunded(Long bookingId);

    BookingResponse cancelAdmin(Long bookingId);

    BookingResponse checkIn(String qrCode);

    BookingResponse checkInAdmin(Long bookingId, String qrCode);

    BookingResponse lookupForCheckIn(String bookingCode, String qrCode);

    List<BookingResponse> getRecentStaffCheckInBookings(int limit);

    List<BookingResponse> getStaffBookingsByShowtime(Long showtimeId);

    int releaseExpiredHolds();
}
