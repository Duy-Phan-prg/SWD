package com.sba301.cinemaai.dto.request.promotion;

import com.sba301.cinemaai.enums.PromotionType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;

@Getter
public class PromotionCreateRequest {

    @NotBlank(message = "Promotion code is required")
    @Size(max = 50, message = "Code must not exceed 50 characters")
    private String code;

    @NotBlank(message = "Promotion name is required")
    private String name;

    @NotNull(message = "Promotion type is required")
    private PromotionType type;

    @NotNull(message = "Promotion value is required")
    @Positive(message = "Value must be positive")
    private BigDecimal value;

    @Positive(message = "Min order amount must be positive")
    private BigDecimal minOrderAmount;

    @Positive(message = "Max discount amount must be positive")
    private BigDecimal maxDiscountAmount;

    @Positive(message = "Usage limit must be positive")
    private Integer usageLimit;

    @NotNull(message = "Start time is required")
    private LocalDateTime startsAt;

    @NotNull(message = "End time is required")
    @Future(message = "End time must be in the future")
    private LocalDateTime endsAt;
}
