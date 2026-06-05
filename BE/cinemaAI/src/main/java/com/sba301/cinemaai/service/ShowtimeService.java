package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.cinema.ShowtimeRequest;
import com.sba301.cinemaai.dto.response.cinema.ShowtimeResponse;
import com.sba301.cinemaai.dto.response.cinema.ShowtimeSeatMapResponse;
import com.sba301.cinemaai.dto.response.cinema.ShowtimeSeatResponse;
import com.sba301.cinemaai.entity.BookingSeat;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.Room;
import com.sba301.cinemaai.entity.Seat;
import com.sba301.cinemaai.entity.Showtime;
import com.sba301.cinemaai.enums.MovieStatus;
import com.sba301.cinemaai.enums.SeatRuntimeStatus;
import com.sba301.cinemaai.enums.SeatStatus;
import com.sba301.cinemaai.enums.ShowtimeStatus;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.ConflictException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.mapper.CinemaMapper;
import com.sba301.cinemaai.repository.BookingSeatRepository;
import com.sba301.cinemaai.repository.MovieRepository;
import com.sba301.cinemaai.repository.SeatRepository;
import com.sba301.cinemaai.repository.ShowtimeRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShowtimeService {

    private static final int CLEANUP_MINUTES = 15;

    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final SeatRepository seatRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final RoomService roomService;
    private final CinemaMapper cinemaMapper;

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> searchPublic(Long movieId, Long roomId, LocalDate date) {
        return search(movieId, roomId, date)
                .stream()
                .filter(showtime -> showtime.getStatus() == ShowtimeStatus.OPEN
                        || showtime.getStatus() == ShowtimeStatus.SCHEDULED)
                .map(cinemaMapper::toShowtimeResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ShowtimeResponse> searchAdmin(Long movieId, Long roomId, LocalDate date) {
        return search(movieId, roomId, date)
                .stream()
                .map(cinemaMapper::toShowtimeResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ShowtimeResponse get(Long id) {
        return cinemaMapper.toShowtimeResponse(findById(id));
    }

    @Transactional
    public ShowtimeResponse create(ShowtimeRequest request) {
        Movie movie = findMovie(request.movieId());
        Room room = roomService.findById(request.roomId());
        LocalDateTime endTime = calculateEndTime(movie, request.startTime());
        validateShowtime(movie, request.startTime(), room, endTime, null);

        Showtime showtime = new Showtime(movie, room, request.startTime(), endTime, request.basePrice());
        showtime.changePrices(request.basePrice(), request.vipPrice(), request.couplePrice());
        showtime.changeStatus(request.status() == null ? ShowtimeStatus.SCHEDULED : request.status());
        return cinemaMapper.toShowtimeResponse(showtimeRepository.save(showtime));
    }

    @Transactional
    public ShowtimeResponse update(Long id, ShowtimeRequest request) {
        Showtime showtime = findById(id);
        Movie movie = findMovie(request.movieId());
        Room room = roomService.findById(request.roomId());
        LocalDateTime endTime = calculateEndTime(movie, request.startTime());
        validateShowtime(movie, request.startTime(), room, endTime, id);

        showtime.reschedule(request.startTime(), endTime);
        showtime.changePrices(request.basePrice(), request.vipPrice(), request.couplePrice());
        showtime.changeStatus(request.status() == null ? showtime.getStatus() : request.status());
        return cinemaMapper.toShowtimeResponse(showtime);
    }

    @Transactional
    public ShowtimeResponse updateStatus(Long id, ShowtimeStatus status) {
        Showtime showtime = findById(id);
        showtime.changeStatus(status);
        return cinemaMapper.toShowtimeResponse(showtime);
    }

    @Transactional(readOnly = true)
    public ShowtimeSeatMapResponse getSeatMap(Long showtimeId) {
        Showtime showtime = findById(showtimeId);
        List<Seat> seats = seatRepository.findByRoom(showtime.getRoom())
                .stream()
                .sorted(Comparator.comparing(Seat::getRowLabel).thenComparingInt(Seat::getSeatNumber))
                .toList();
        Map<Long, BookingSeat> runtimeSeats = bookingSeatRepository.findByShowtime(showtime)
                .stream()
                .filter(bookingSeat -> bookingSeat.getStatus() != SeatRuntimeStatus.RELEASED)
                .collect(Collectors.toMap(bookingSeat -> bookingSeat.getSeat().getId(), Function.identity(), (left, right) -> left));

        List<ShowtimeSeatResponse> seatResponses = seats.stream()
                .map(seat -> cinemaMapper.toShowtimeSeatResponse(seat, resolveRuntimeStatus(seat, runtimeSeats), showtime))
                .toList();
        return new ShowtimeSeatMapResponse(
                cinemaMapper.toShowtimeResponse(showtime),
                showtime.getRoom().getRowCount(),
                showtime.getRoom().getColumnCount(),
                seatResponses
        );
    }

    private List<Showtime> search(Long movieId, Long roomId, LocalDate date) {
        LocalDateTime from = date == null ? LocalDate.now().atStartOfDay() : date.atStartOfDay();
        LocalDateTime to = date == null ? LocalDate.now().plusYears(1).atStartOfDay() : date.plusDays(1).atStartOfDay();
        return showtimeRepository.findByStartTimeBetween(from, to)
                .stream()
                .filter(showtime -> movieId == null || showtime.getMovie().getId().equals(movieId))
                .filter(showtime -> roomId == null || showtime.getRoom().getId().equals(roomId))
                .sorted(Comparator.comparing(Showtime::getStartTime))
                .toList();
    }

    private void validateShowtime(Movie movie, LocalDateTime startTime, Room room, LocalDateTime endTime, Long excludeId) {
        if (movie.getStatus() == MovieStatus.INACTIVE) {
            throw new BadRequestException("Cannot schedule inactive movie");
        }
        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("Showtime end time must be after start time");
        }
        if (hasOverlappingShowtime(room, startTime, endTime, excludeId)) {
            throw new ConflictException("Room already has an overlapping showtime");
        }
    }

    private boolean hasOverlappingShowtime(Room room, LocalDateTime startTime, LocalDateTime endTime, Long excludeId) {
        return showtimeRepository.findByRoom(room)
                .stream()
                .filter(showtime -> showtime.getStatus() != ShowtimeStatus.CANCELLED)
                .filter(showtime -> excludeId == null || !showtime.getId().equals(excludeId))
                .anyMatch(showtime -> showtime.getStartTime().isBefore(endTime)
                        && showtime.getEndTime().isAfter(startTime));
    }

    private LocalDateTime calculateEndTime(Movie movie, LocalDateTime startTime) {
        return startTime.plusMinutes(movie.getDurationMinutes()).plusMinutes(CLEANUP_MINUTES);
    }

    private String resolveRuntimeStatus(Seat seat, Map<Long, BookingSeat> runtimeSeats) {
        if (seat.getStatus() != SeatStatus.AVAILABLE) {
            return "UNAVAILABLE";
        }
        BookingSeat bookingSeat = runtimeSeats.get(seat.getId());
        if (bookingSeat == null) {
            return "AVAILABLE";
        }
        return bookingSeat.getStatus().name();
    }

    private Movie findMovie(Long movieId) {
        return movieRepository.findById(movieId)
                .orElseThrow(() -> new NotFoundException("Movie not found"));
    }

    private Showtime findById(Long id) {
        return showtimeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Showtime not found"));
    }
}
