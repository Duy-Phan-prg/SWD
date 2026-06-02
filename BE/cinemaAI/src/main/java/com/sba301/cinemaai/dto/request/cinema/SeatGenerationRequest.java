package com.sba301.cinemaai.dto.request.cinema;

import com.sba301.cinemaai.enums.SeatType;
import jakarta.validation.constraints.NotNull;

public record SeatGenerationRequest(
        @NotNull(message = "Default seat type is required")
        SeatType defaultSeatType,

        boolean overwriteExisting
) {
}
