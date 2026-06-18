package com.sba301.cinemaai.seeder;

import com.sba301.cinemaai.entity.Cinema;
import com.sba301.cinemaai.entity.Room;
import com.sba301.cinemaai.entity.Seat;
import com.sba301.cinemaai.entity.SeatRow;
import com.sba301.cinemaai.enums.RoomType;
import com.sba301.cinemaai.enums.SeatType;
import com.sba301.cinemaai.repository.CinemaRepository;
import com.sba301.cinemaai.repository.RoomRepository;
import com.sba301.cinemaai.repository.SeatRepository;
import com.sba301.cinemaai.repository.SeatRowRepository;
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

}
