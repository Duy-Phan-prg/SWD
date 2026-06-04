package com.sba301.cinemaai.entity;

import com.sba301.cinemaai.enums.SeatStatus;
import com.sba301.cinemaai.enums.SeatType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "seats",
        uniqueConstraints = @UniqueConstraint(columnNames = {"room_id", "row_label", "seat_number"})
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Seat extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seat_row_id", nullable = false)
    private SeatRow seatRow;

    @Column(name = "row_label", nullable = false, length = 10)
    private String rowLabel;

    @Column(name = "seat_number", nullable = false)
    private int seatNumber;

    @Column(name = "display_column", nullable = false)
    private int displayColumn;

    @Enumerated(EnumType.STRING)
    @Column(name = "seat_type", nullable = false, length = 30)
    private SeatType seatType = SeatType.STANDARD;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SeatStatus status = SeatStatus.AVAILABLE;

    public Seat(Room room, SeatRow seatRow, int seatNumber, int displayColumn, SeatType seatType) {
        this.room = room;
        this.seatRow = seatRow;
        this.rowLabel = seatRow.getRowLabel();
        this.seatNumber = seatNumber;
        this.displayColumn = displayColumn;
        this.seatType = seatType;
    }

    public void changeType(SeatType seatType) {
        this.seatType = seatType;
    }

    public void changeStatus(SeatStatus status) {
        this.status = status;
    }
}
