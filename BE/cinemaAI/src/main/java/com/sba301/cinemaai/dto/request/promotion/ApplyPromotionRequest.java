package com.sba301.cinemaai.dto.request.promotion;

import jakarta.validation.constraints.*;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class ApplyPromotionRequest {
    @NotBlank(message = "Promotion code is required")
    private String code;

    @NotNull(message = "Order amount is required")
    @Positive(message = "Order amount must be positive")
    private BigDecimal orderAmount;

    // Nếu cần check user đã dùng mã chưa
    @NotNull(message = "User ID is required")
    private Long userId;
}
