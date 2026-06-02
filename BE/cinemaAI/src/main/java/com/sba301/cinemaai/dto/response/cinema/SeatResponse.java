package com.sba301.cinemaai.dto.response.cinema;

import com.sba301.cinemaai.enums.SeatStatus;
import com.sba301.cinemaai.enums.SeatType;

public record SeatResponse(
        Long id,
        Long roomId,
        String rowLabel,
        int seatNumber,
        SeatType seatType,
        SeatStatus status
) {
}
