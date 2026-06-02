package com.sba301.cinemaai.dto.response.promotion;
import com.sba301.cinemaai.entity.Promotion;
import com.sba301.cinemaai.enums.PromotionStatus;
import com.sba301.cinemaai.enums.PromotionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PromotionResponse {

    private Long id;
    private String code;
    private String name;
    private PromotionType type;
    private BigDecimal value;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private Integer usageLimit;
    private int usedCount;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private PromotionStatus status;

    // Static factory — tránh để mapping logic rải rác trong service
    public static PromotionResponse from(Promotion promotion) {
        return PromotionResponse.builder()
                .id(promotion.getId())
                .code(promotion.getCode())
                .name(promotion.getName())
                .type(promotion.getType())
                .value(promotion.getValue())
                .minOrderAmount(promotion.getMinOrderAmount())
                .maxDiscountAmount(promotion.getMaxDiscountAmount())
                .usageLimit(promotion.getUsageLimit())
                .usedCount(promotion.getUsedCount())
                .startsAt(promotion.getStartsAt())
                .endsAt(promotion.getEndsAt())
                .status(promotion.getStatus())
                .build();
    }}
