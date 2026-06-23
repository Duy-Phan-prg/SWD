package com.sba301.cinemaai.dto.response.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RevenueReportResponse {

    private LocalDate from;
    private LocalDate to;
    private BigDecimal totalRevenue;
    private long totalTransactions;
    private long totalTicketsSold;
}
