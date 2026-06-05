package com.sba301.cinemaai.entity;

import com.sba301.cinemaai.enums.PromotionStatus;
import com.sba301.cinemaai.enums.PromotionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "promotions")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Promotion extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PromotionType type;

    @Column(name = "promotion_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal value;

    @Column(name = "min_order_amount", precision = 12, scale = 2)
    private BigDecimal minOrderAmount;

    @Column(name = "max_discount_amount", precision = 12, scale = 2)
    private BigDecimal maxDiscountAmount;

    @Column(name = "usage_limit")
    private Integer usageLimit;

    @Column(name = "used_count", nullable = false)
    private int usedCount;

    @Column(name = "starts_at", nullable = false)
    private LocalDateTime startsAt;

    @Column(name = "ends_at", nullable = false)
    private LocalDateTime endsAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PromotionStatus status = PromotionStatus.ACTIVE;

    public Promotion(String code, String name, PromotionType type, BigDecimal value, LocalDateTime startsAt, LocalDateTime endsAt) {
        this.code = code;
        this.name = name;
        this.type = type;
        this.value = value;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
    }

    public void increaseUsage() {
        this.usedCount++;
    }

    public void changeStatus(PromotionStatus status) {
        this.status = status;
    }

    public void updateMaxDiscount(BigDecimal maxDiscountAmount) {
        this.maxDiscountAmount = maxDiscountAmount;
    }

    public void updateMinOrder(BigDecimal minOrderAmount) {
        this.minOrderAmount = minOrderAmount;
    }

    public void updateUsageLimit(Integer usageLimit) {
        this.usageLimit = usageLimit;
    }

    public void updateName(String name) {
        this.name = name;
    }

    public void updateType(PromotionType type) {
        this.type = type;
    }

    public void updateValue(BigDecimal value) {
        this.value = value;
    }

    public void updateDates(LocalDateTime startsAt, LocalDateTime endsAt) {
        this.startsAt = startsAt;
        this.endsAt = endsAt;
    }
}
