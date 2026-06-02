package com.sba301.cinemaai.dto.response.cinema;

import com.sba301.cinemaai.enums.ShowtimeStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ShowtimeResponse(
        Long id,
        Long movieId,
        String movieTitle,
        Long cinemaId,
        String cinemaName,
        Long roomId,
        String roomName,
        LocalDateTime startTime,
        LocalDateTime endTime,
        BigDecimal basePrice,
        BigDecimal vipPrice,
        BigDecimal couplePrice,
        ShowtimeStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
