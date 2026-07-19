package com.sba301.cinemaai.entity;

import com.sba301.cinemaai.enums.FoodOrderStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Entity
@Table(
        name = "food_orders",
        indexes = @Index(name = "idx_food_orders_booking", columnList = "booking_id")
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FoodOrder extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(name = "order_code", nullable = false, unique = true, length = 40)
    private String orderCode;

    @Setter
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FoodOrderStatus status = FoodOrderStatus.PENDING_PAYMENT;

    @Setter
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Setter
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "created_by_staff", nullable = false)
    private boolean createdByStaff;

    public FoodOrder(Booking booking, String orderCode, boolean createdByStaff) {
        this.booking = booking;
        this.orderCode = orderCode;
        this.createdByStaff = createdByStaff;
    }
}
