package com.sba301.cinemaai.dto.response.cinema;

import com.sba301.cinemaai.enums.SeatStatus;
import com.sba301.cinemaai.enums.SeatType;
import java.math.BigDecimal;

public record ShowtimeSeatResponse(
        Long seatId,
        String rowLabel,
        int seatNumber,
        SeatType seatType,
        SeatStatus seatStatus,
        String runtimeStatus,
        BigDecimal unitPrice
) {
}
