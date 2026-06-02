package com.sba301.cinemaai.dto.response.ticket;

import com.sba301.cinemaai.enums.RoomType;
import com.sba301.cinemaai.enums.TicketType;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TicketPricingRuleResponse(
        Long id,
        TicketType ticketType,
        RoomType roomType,
        boolean weekend,
        boolean holiday,
        BigDecimal price,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
