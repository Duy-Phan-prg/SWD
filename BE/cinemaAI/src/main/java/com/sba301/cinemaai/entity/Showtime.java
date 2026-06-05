package com.sba301.cinemaai.entity;

import com.sba301.cinemaai.enums.SeatType;
import com.sba301.cinemaai.enums.ShowtimeStatus;
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

@Getter
@Entity
@Table(
        name = "showtimes",
        indexes = {
                @Index(name = "idx_showtimes_movie", columnList = "movie_id"),
                @Index(name = "idx_showtimes_room", columnList = "room_id"),
                @Index(name = "idx_showtimes_start_time", columnList = "start_time")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Showtime extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "base_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "vip_price", precision = 12, scale = 2)
    private BigDecimal vipPrice;

    @Column(name = "couple_price", precision = 12, scale = 2)
    private BigDecimal couplePrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ShowtimeStatus status = ShowtimeStatus.SCHEDULED;

    public Showtime(Movie movie, Room room, LocalDateTime startTime, LocalDateTime endTime, BigDecimal basePrice) {
        this.movie = movie;
        this.room = room;
        this.startTime = startTime;
        this.endTime = endTime;
        this.basePrice = basePrice;
    }

    public void reschedule(LocalDateTime startTime, LocalDateTime endTime) {
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public void changeBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    public void changePrices(BigDecimal basePrice, BigDecimal vipPrice, BigDecimal couplePrice) {
        this.basePrice = basePrice;
        this.vipPrice = vipPrice;
        this.couplePrice = couplePrice;
    }

    public BigDecimal getPriceForSeatType(SeatType seatType) {
        return switch (seatType) {
            case VIP    -> vipPrice    != null ? vipPrice    : basePrice.multiply(new BigDecimal("1.5"));
            case COUPLE -> couplePrice != null ? couplePrice : basePrice.multiply(new BigDecimal("2.0"));
            default     -> basePrice;
        };
    }

    public void changeStatus(ShowtimeStatus status) {
        this.status = status;
    }
}
