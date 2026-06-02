package com.sba301.cinemaai.dto.request.cinema;

import com.sba301.cinemaai.enums.ShowtimeStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ShowtimeRequest(
        @NotNull(message = "Movie id is required")
        Long movieId,

        @NotNull(message = "Room id is required")
        Long roomId,

        @NotNull(message = "Start time is required")
        LocalDateTime startTime,

        @NotNull(message = "Base price is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Base price must be positive")
        BigDecimal basePrice,

        @DecimalMin(value = "0.0", inclusive = false, message = "VIP price must be positive")
        BigDecimal vipPrice,

        @DecimalMin(value = "0.0", inclusive = false, message = "Couple price must be positive")
        BigDecimal couplePrice,

        ShowtimeStatus status
) {
}
