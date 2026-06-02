package com.sba301.cinemaai.mapper;

import com.sba301.cinemaai.dto.response.cinema.CinemaResponse;
import com.sba301.cinemaai.dto.response.cinema.RoomResponse;
import com.sba301.cinemaai.dto.response.cinema.SeatResponse;
import com.sba301.cinemaai.dto.response.cinema.ShowtimeResponse;
import com.sba301.cinemaai.dto.response.cinema.ShowtimeSeatResponse;
import com.sba301.cinemaai.entity.Cinema;
import com.sba301.cinemaai.entity.Seat;
import com.sba301.cinemaai.entity.Room;
import com.sba301.cinemaai.entity.Showtime;
import org.springframework.stereotype.Component;

@Component
public class CinemaMapper {

    public CinemaResponse toCinemaResponse(Cinema cinema) {
        return new CinemaResponse(
                cinema.getId(),
                cinema.getName(),
                cinema.getAddress(),
                cinema.getCity(),
                cinema.getPhone(),
                cinema.getStatus(),
                cinema.getCreatedAt(),
                cinema.getUpdatedAt()
        );
    }

    public RoomResponse toRoomResponse(Room room) {
        return new RoomResponse(
                room.getId(),
                room.getCinema().getId(),
                room.getCinema().getName(),
                room.getName(),
                room.getRoomType(),
                room.getRowCount(),
                room.getColumnCount(),
                room.getStatus(),
                room.getCreatedAt(),
                room.getUpdatedAt()
        );
    }

    public SeatResponse toSeatResponse(Seat seat) {
        return new SeatResponse(
                seat.getId(),
                seat.getRoom().getId(),
                seat.getRowLabel(),
                seat.getSeatNumber(),
                seat.getSeatType(),
                seat.getStatus()
        );
    }

    public ShowtimeResponse toShowtimeResponse(Showtime showtime) {
        return new ShowtimeResponse(
                showtime.getId(),
                showtime.getMovie().getId(),
                showtime.getMovie().getTitle(),
                showtime.getRoom().getCinema().getId(),
                showtime.getRoom().getCinema().getName(),
                showtime.getRoom().getId(),
                showtime.getRoom().getName(),
                showtime.getStartTime(),
                showtime.getEndTime(),
                showtime.getBasePrice(),
                showtime.getVipPrice(),
                showtime.getCouplePrice(),
                showtime.getStatus(),
                showtime.getCreatedAt(),
                showtime.getUpdatedAt()
        );
    }

    public ShowtimeSeatResponse toShowtimeSeatResponse(Seat seat, String runtimeStatus, Showtime showtime) {
        return new ShowtimeSeatResponse(
                seat.getId(),
                seat.getRowLabel(),
                seat.getSeatNumber(),
                seat.getSeatType(),
                seat.getStatus(),
                runtimeStatus,
                showtime.getPriceForSeatType(seat.getSeatType())
        );
    }
}
