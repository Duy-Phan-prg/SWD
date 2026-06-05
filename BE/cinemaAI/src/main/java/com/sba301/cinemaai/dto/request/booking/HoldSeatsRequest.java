package com.sba301.cinemaai.dto.request.booking;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record HoldSeatsRequest(
        @NotNull(message = "Showtime id is required")
        Long showtimeId,

        @NotEmpty(message = "At least one seat is required")
        List<Long> seatIds
) {
}
