package com.sba301.cinemaai.dto.response.refund;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BulkRefundDetailResponse(
        Long bookingId,
        String bookingCode,
        Long userId,
        String customerName,
        String customerEmail,
        String movieName,
        LocalDateTime showtimeStart,
        String roomName,
        BigDecimal refundAmount,
        LoyaltyCalculation loyaltyCalculation,
        String failureReason,
        String refundMethod,
        LocalDateTime refundRequestedAt,
        LocalDateTime refundedAt
) {
    public record LoyaltyCalculation(
            int restoreRedeemPoints,
            int revokeEarnedPoints,
            int netBalanceChange
    ) {
    }
}
