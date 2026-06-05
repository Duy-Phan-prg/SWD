package com.sba301.cinemaai.dto.request.cinema;

import com.sba301.cinemaai.enums.SeatType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import java.util.List;

public record SeatGenerationRequest(
        @NotNull(message = "Default seat type is required")
        SeatType defaultSeatType,

        boolean overwriteExisting,

        List<@Valid SeatRowGenerationRequest> rows
) {
    public SeatGenerationRequest(SeatType defaultSeatType, boolean overwriteExisting) {
        this(defaultSeatType, overwriteExisting, null);
    }
}
