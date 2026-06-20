package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.response.booking.BookingResponse;
import com.sba301.cinemaai.dto.request.booking.CreateBookingRequest;
import com.sba301.cinemaai.dto.request.booking.HoldSeatsRequest;
import com.sba301.cinemaai.dto.request.booking.RefundRequest;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.dto.response.PageResponse;
import com.sba301.cinemaai.security.AuthenticatedUser;
import com.sba301.cinemaai.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/hold")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingResponse> holdSeats(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody HoldSeatsRequest request
    ) {
        return ApiResponse.success(bookingService.holdSeats(user.getUsername(), request), "Seats held successfully");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingResponse> createBooking(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateBookingRequest request
    ) {
        return ApiResponse.success(bookingService.createBooking(user.getUsername(), request), "Booking created successfully");
    }

    @GetMapping
    public ApiResponse<PageResponse<BookingResponse>> getMyBookings(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(bookingService.getMyBookings(user.getUsername(), page, size));
    }

    @GetMapping("/{bookingId}")
    public ApiResponse<BookingResponse> getMyBooking(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long bookingId
    ) {
        return ApiResponse.success(bookingService.getMyBooking(user.getUsername(), bookingId));
    }

    @DeleteMapping("/{bookingId}")
    public ApiResponse<BookingResponse> cancel(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long bookingId
    ) {
        return ApiResponse.success(bookingService.cancel(user.getUsername(), bookingId), "Booking cancelled successfully");
    }

    @PostMapping("/{bookingId}/refund-request")
    public ApiResponse<BookingResponse> requestRefund(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long bookingId,
            @Valid @RequestBody RefundRequest request
    ) {
        return ApiResponse.success(
                bookingService.requestRefund(user.getUsername(), bookingId, request.reason()),
                "Refund requested successfully"
        );
    }
}
