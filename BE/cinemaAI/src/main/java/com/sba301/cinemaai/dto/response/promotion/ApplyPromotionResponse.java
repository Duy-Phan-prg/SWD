package com.sba301.cinemaai.dto.response.promotion;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApplyPromotionResponse {

    private String code;
    private String promotionName;
    private BigDecimal originalAmount;   // Giá gốc
    private BigDecimal discountAmount;   // Số tiền được giảm
    private BigDecimal finalAmount;      // Giá sau giảm
    private String message;
}