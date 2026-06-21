package com.sba301.cinemaai.seeder;

import com.sba301.cinemaai.entity.Cinema;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.Room;
import com.sba301.cinemaai.entity.Seat;
import com.sba301.cinemaai.entity.SeatRow;
import com.sba301.cinemaai.entity.Showtime;
import com.sba301.cinemaai.enums.RoomType;
import com.sba301.cinemaai.enums.SeatType;
import com.sba301.cinemaai.enums.ShowtimeStatus;
import com.sba301.cinemaai.repository.CinemaRepository;
import com.sba301.cinemaai.repository.MovieRepository;
import com.sba301.cinemaai.repository.RoomRepository;
import com.sba301.cinemaai.repository.SeatRepository;
import com.sba301.cinemaai.repository.SeatRowRepository;
import com.sba301.cinemaai.repository.ShowtimeRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(40)
@RequiredArgsConstructor
public class CinemaScheduleSeeder implements Seeder {

    private final CinemaRepository cinemaRepository;
    private final RoomRepository roomRepository;
    private final SeatRepository seatRepository;
    private final SeatRowRepository seatRowRepository;
    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;

    @Override
    @Transactional
    public void seed() {
        Cinema cinema = cinemaRepository.findByName("CineAI Central")
                .orElseGet(() -> cinemaRepository.save(new Cinema(
                        "CineAI Central",
                        "1 Nguyen Hue, District 1",
                        "Ho Chi Minh City",
                        "0900000000"
                )));

        Room room = roomRepository.findByCinemaAndNameIgnoreCase(cinema, "Room A")
                .orElseGet(() -> roomRepository.save(new Room(cinema, "Room A", RoomType.TWO_D, 5, 8)));

        seedSeats(room);
        seedShowtimes(room);
    }

    private void seedSeats(Room room) {
        for (char row = 'A'; row <= 'E'; row++) {
            String rowLabel = Character.toString(row);
            SeatType rowType = row == 'E' ? SeatType.VIP : SeatType.NORMAL;
            int displayOrder = row - 'A' + 1;
            SeatRow seatRow = seatRowRepository.findByRoomAndRowLabel(room, rowLabel)
                    .orElseGet(() -> seatRowRepository.save(new SeatRow(
                            room,
                            rowLabel,
                            displayOrder,
                            1,
                            rowType
                    )));
            for (int number = 1; number <= 8; number++) {
                if (!seatRepository.existsByRoomAndRowLabelAndSeatNumber(room, rowLabel, number)) {
                    seatRepository.save(new Seat(room, seatRow, number, number, rowType));
                }
            }
        }
    }

    private void seedShowtimes(Room room) {
        movieRepository.findByTitle("The Last Orbit").ifPresent(movie ->
                seedShowtime(room, movie, LocalDateTime.now().plusDays(1).withHour(18).withMinute(30).withSecond(0).withNano(0))
        );
        movieRepository.findByTitle("Saigon Midnight").ifPresent(movie ->
                seedShowtime(room, movie, LocalDateTime.now().plusDays(2).withHour(20).withMinute(0).withSecond(0).withNano(0))
        );
    }

    private void seedShowtime(Room room, Movie movie, LocalDateTime startTime) {
        if (showtimeRepository.existsByRoomAndMovieAndStartTime(room, movie, startTime)) {
            return;
        }

        LocalDateTime endTime = startTime.plusMinutes(movie.getDurationMinutes()).plusMinutes(15);
        Showtime showtime = new Showtime(movie, room, startTime, endTime, BigDecimal.valueOf(90000));
        showtime.setStatus(ShowtimeStatus.OPEN);
        showtimeRepository.save(showtime);
    }
}
