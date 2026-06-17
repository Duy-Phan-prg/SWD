package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.response.booking.BookingResponse;
import com.sba301.cinemaai.dto.request.booking.CheckInRequest;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/staff/check-in")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Check-In", description = "Check-in endpoints - requires STAFF role")
public class StaffCheckInController {

    private final BookingService bookingService;

    @GetMapping("/lookup")
    @Operation(summary = "Lookup booking for check-in (Staff)", description = "Lookup a booking by booking code or QR code before check-in (Staff only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Booking retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Missing booking code or QR code"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have STAFF role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Booking not found")
    })
    public ApiResponse<BookingResponse> lookup(
            @RequestParam(required = false) String bookingCode,
            @RequestParam(required = false) String qrCode
    ) {
        return ApiResponse.success(bookingService.lookupForCheckIn(bookingCode, qrCode));
    }

    @GetMapping("/showtimes/{showtimeId}/bookings")
    @Operation(summary = "List showtime bookings for check-in (Staff)", description = "List all bookings of a showtime so staff can monitor paid/used tickets at the gate")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Bookings retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have STAFF role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Showtime not found")
    })
    public ApiResponse<List<BookingResponse>> listShowtimeBookings(@PathVariable Long showtimeId) {
        return ApiResponse.success(bookingService.getStaffBookingsByShowtime(showtimeId));
    }

    @PostMapping
    @Operation(summary = "Check in ticket (Staff)", description = "Check in a booking using QR code (Staff only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Ticket checked in successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request body"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have STAFF role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Ticket not found")
    })
    public ApiResponse<BookingResponse> checkIn(@Valid @RequestBody CheckInRequest request) {
        return ApiResponse.success(bookingService.checkIn(request.qrCode()), "Ticket checked in successfully");
    }
}
