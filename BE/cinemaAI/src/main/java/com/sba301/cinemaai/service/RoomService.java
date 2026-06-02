package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.cinema.RoomRequest;
import com.sba301.cinemaai.dto.response.cinema.RoomResponse;
import com.sba301.cinemaai.dto.request.cinema.SeatGenerationRequest;
import com.sba301.cinemaai.dto.response.cinema.SeatResponse;
import com.sba301.cinemaai.dto.request.cinema.SeatUpdateRequest;
import com.sba301.cinemaai.entity.Cinema;
import com.sba301.cinemaai.entity.Room;
import com.sba301.cinemaai.entity.Seat;
import com.sba301.cinemaai.enums.RoomStatus;
import com.sba301.cinemaai.enums.SeatStatus;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.ConflictException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.mapper.CinemaMapper;
import com.sba301.cinemaai.repository.RoomRepository;
import com.sba301.cinemaai.repository.SeatRepository;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final SeatRepository seatRepository;
    private final CinemaService cinemaService;
    private final CinemaMapper cinemaMapper;

    @Transactional(readOnly = true)
    public List<RoomResponse> getRooms() {
        Cinema cinema = cinemaService.findSingleton();
        return roomRepository.findByCinema(cinema)
                .stream()
                .map(cinemaMapper::toRoomResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getRoomsByCinema(Long cinemaId) {
        Cinema cinema = cinemaService.findSingletonById(cinemaId);
        return roomRepository.findByCinema(cinema)
                .stream()
                .map(cinemaMapper::toRoomResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoom(Long id) {
        return cinemaMapper.toRoomResponse(findById(id));
    }

    @Transactional
    public RoomResponse create(RoomRequest request) {
        Cinema cinema = resolveCinema(request.cinemaId());
        roomRepository.findByCinemaAndName(cinema, request.name()).ifPresent(room -> {
            throw new ConflictException("Room name already exists in this cinema");
        });
        Room room = new Room(cinema, request.name(), request.roomType(), request.rowCount(), request.columnCount());
        room.changeStatus(request.status() == null ? RoomStatus.ACTIVE : request.status());
        return cinemaMapper.toRoomResponse(roomRepository.save(room));
    }

    @Transactional
    public RoomResponse update(Long id, RoomRequest request) {
        Room room = findById(id);
        Cinema cinema = resolveCinema(request.cinemaId());
        if (!room.getCinema().getId().equals(cinema.getId())) {
            throw new BadRequestException("Cannot move room to another cinema");
        }
        roomRepository.findByCinemaAndName(cinema, request.name())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ConflictException("Room name already exists in this cinema");
                });
        room.updateLayout(request.name(), request.roomType(), request.rowCount(), request.columnCount());
        room.changeStatus(request.status() == null ? room.getStatus() : request.status());
        return cinemaMapper.toRoomResponse(room);
    }

    @Transactional
    public RoomResponse updateStatus(Long id, RoomStatus status) {
        Room room = findById(id);
        room.changeStatus(status);
        return cinemaMapper.toRoomResponse(room);
    }

    @Transactional
    public List<SeatResponse> generateSeats(Long roomId, SeatGenerationRequest request) {
        Room room = findById(roomId);
        List<Seat> existingSeats = seatRepository.findByRoom(room);
        if (!existingSeats.isEmpty() && !request.overwriteExisting()) {
            throw new ConflictException("Room already has seats");
        }
        if (!existingSeats.isEmpty()) {
            seatRepository.deleteByRoom(room);
        }

        for (int row = 0; row < room.getRowCount(); row++) {
            String rowLabel = rowLabel(row);
            for (int column = 1; column <= room.getColumnCount(); column++) {
                seatRepository.save(new Seat(room, rowLabel, column, request.defaultSeatType()));
            }
        }
        return getSeats(roomId);
    }

    @Transactional(readOnly = true)
    public List<SeatResponse> getSeats(Long roomId) {
        Room room = findById(roomId);
        return seatRepository.findByRoom(room)
                .stream()
                .sorted(Comparator.comparing(Seat::getRowLabel).thenComparingInt(Seat::getSeatNumber))
                .map(cinemaMapper::toSeatResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SeatResponse getSeat(Long seatId) {
        return cinemaMapper.toSeatResponse(findSeatById(seatId));
    }

    @Transactional
    public SeatResponse updateSeat(Long seatId, SeatUpdateRequest request) {
        Seat seat = findSeatById(seatId);
        seat.changeType(request.seatType());
        seat.changeStatus(request.status());
        return cinemaMapper.toSeatResponse(seat);
    }

    @Transactional
    public SeatResponse deleteSeat(Long seatId) {
        Seat seat = findSeatById(seatId);
        seat.changeStatus(SeatStatus.UNAVAILABLE);
        return cinemaMapper.toSeatResponse(seat);
    }

    public Room findById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Room not found"));
    }

    private Seat findSeatById(Long id) {
        return seatRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Seat not found"));
    }

    private String rowLabel(int index) {
        StringBuilder label = new StringBuilder();
        int value = index;
        do {
            label.insert(0, (char) ('A' + value % 26));
            value = value / 26 - 1;
        } while (value >= 0);
        return label.toString();
    }

    private Cinema resolveCinema(Long cinemaId) {
        return cinemaId == null ? cinemaService.findSingleton() : cinemaService.findSingletonById(cinemaId);
    }
}
