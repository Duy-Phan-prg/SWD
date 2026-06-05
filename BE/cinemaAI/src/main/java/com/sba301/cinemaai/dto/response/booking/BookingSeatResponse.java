package com.sba301.cinemaai.dto.response.booking;

import com.sba301.cinemaai.enums.SeatRuntimeStatus;
import java.math.BigDecimal;

public record BookingSeatResponse(
        Long seatId,
        String rowLabel,
        int seatNumber,
        BigDecimal unitPrice,
        SeatRuntimeStatus status
) {
}
