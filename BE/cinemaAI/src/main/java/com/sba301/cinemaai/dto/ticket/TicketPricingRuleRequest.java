package com.sba301.cinemaai.dto.ticket;

import com.sba301.cinemaai.enums.RoomType;
import com.sba301.cinemaai.enums.TicketType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record TicketPricingRuleRequest(
        @NotNull(message = "Ticket type is required")
        TicketType ticketType,

        @NotNull(message = "Room type is required")
        RoomType roomType,

        boolean weekend,

        boolean holiday,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
        BigDecimal price,

        Boolean active
) {
}
