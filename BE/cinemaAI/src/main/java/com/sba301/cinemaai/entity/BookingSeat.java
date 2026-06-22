package com.sba301.cinemaai.entity;

import com.sba301.cinemaai.enums.SeatRuntimeStatus;
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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "booking_seats",
        indexes = {
                @Index(name = "idx_booking_seats_booking", columnList = "booking_id"),
                @Index(name = "idx_booking_seats_showtime_seat_status", columnList = "showtime_id,seat_id,status")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BookingSeat extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "showtime_id", nullable = false)
    private Showtime showtime;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seat_id", nullable = false)
    private Seat seat;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SeatRuntimeStatus status = SeatRuntimeStatus.HOLDING;

    public BookingSeat(Booking booking, Showtime showtime, Seat seat, BigDecimal unitPrice) {
        this.booking = booking;
        this.showtime = showtime;
        this.seat = seat;
        this.unitPrice = unitPrice;
    }

    public void updateUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public void changeStatus(SeatRuntimeStatus status) {
        this.status = status;
    }
}
