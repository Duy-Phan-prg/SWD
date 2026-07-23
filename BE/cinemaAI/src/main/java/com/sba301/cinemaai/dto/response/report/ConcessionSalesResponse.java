package com.sba301.cinemaai.dto.response.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ConcessionSalesResponse(
        LocalDate from,
        LocalDate to,
        long totalItemsSold,
        BigDecimal totalRevenue,
        List<Line> lines
) {
    public record Line(String name, long quantity, BigDecimal revenue) {
    }
}
