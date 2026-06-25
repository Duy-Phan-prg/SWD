package com.sba301.cinemaai.service.impl;

import com.sba301.cinemaai.dto.request.cinema.BulkShowtimeRequest;
import com.sba301.cinemaai.dto.request.cinema.ShowtimeRequest;
import com.sba301.cinemaai.dto.response.PageResponse;
import com.sba301.cinemaai.dto.response.cinema.ShowtimeResponse;
import com.sba301.cinemaai.dto.response.cinema.ShowtimeSeatMapResponse;
import com.sba301.cinemaai.dto.response.cinema.ShowtimeSeatResponse;
import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.BookingSeat;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.Room;
import com.sba301.cinemaai.entity.Seat;
import com.sba301.cinemaai.entity.Showtime;
import com.sba301.cinemaai.enums.BookingStatus;
import com.sba301.cinemaai.enums.MovieStatus;
import com.sba301.cinemaai.enums.RoomStatus;
import com.sba301.cinemaai.enums.SeatRuntimeStatus;
import com.sba301.cinemaai.enums.SeatStatus;
import com.sba301.cinemaai.enums.ShowtimeStatus;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.ConflictException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.mapper.CinemaMapper;
import com.sba301.cinemaai.repository.BookingRepository;
import com.sba301.cinemaai.repository.BookingSeatRepository;
import com.sba301.cinemaai.repository.MovieRepository;
import com.sba301.cinemaai.repository.SeatRepository;
import com.sba301.cinemaai.repository.ShowtimeRepository;
import com.sba301.cinemaai.service.LoyaltyPointService;
import com.sba301.cinemaai.service.NotificationService;
import com.sba301.cinemaai.service.RoomService;
import com.sba301.cinemaai.service.ShowtimeService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShowtimeServiceImpl implements ShowtimeService {

    private static final int CLEANUP_MINUTES = 15;
    private static final List<BookingStatus> ACTIVE_BOOKING_STATUSES = List.of(
            BookingStatus.HOLDING,
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.PAID,
            BookingStatus.REFUND_REQUESTED
    );

    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final SeatRepository seatRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final RoomService roomService;
    private final CinemaMapper cinemaMapper;
    private final LoyaltyPointService loyaltyPointService;
    private final NotificationService notificationService;

    // -------------------------------------------------------------------------
    // PUBLIC (customer-facing)
    // -------------------------------------------------------------------------

    /**
     * Public showtime search: only returns OPEN showtimes.
     * SCHEDULED is an internal admin state — customers cannot book it.
     */
    @Transactional(readOnly = true)
    public PageResponse<ShowtimeResponse> searchPublic(Long movieId, Long roomId, LocalDate date, int page, int size) {
        LocalDateTime from = date == null ? LocalDate.now().atStartOfDay() : date.atStartOfDay();
        LocalDateTime to = date == null ? LocalDate.now().plusYears(1).atStartOfDay() : date.plusDays(1).atStartOfDay();
        return PageResponse.from(showtimeRepository.searchPublic(
                movieId,
                roomId,
                from,
                to,
                pageable(page, size, Sort.by("startTime").ascending())
        ).map(cinemaMapper::toShowtimeResponse));
    }

    // -------------------------------------------------------------------------
    // ADMIN
    // -------------------------------------------------------------------------

    /**
     * Admin paged search — all statuses visible, full filter support.
     */
    @Transactional(readOnly = true)
    public PageResponse<ShowtimeResponse> searchAdmin(
            Long movieId, Long roomId, Long cinemaId,
            ShowtimeStatus status,
            LocalDate date,
            int page, int size) {

        LocalDateTime from = date == null ? LocalDate.now().atStartOfDay()              : date.atStartOfDay();
        LocalDateTime to   = date == null ? LocalDate.now().plusYears(1).atStartOfDay() : date.plusDays(1).atStartOfDay();

        Pageable pageable = pageable(page, size, Sort.by("startTime").ascending());
        return PageResponse.from(
                showtimeRepository.searchAdmin(movieId, roomId, cinemaId, status, from, to, pageable)
                        .map(cinemaMapper::toShowtimeResponse)
        );
    }

    /** Admin-only detail view (all statuses visible). */
    @Transactional(readOnly = true)
    public ShowtimeResponse getAdmin(Long id) {
        return cinemaMapper.toShowtimeResponse(findById(id));
    }

    // -------------------------------------------------------------------------
    // SHARED (used by both public and admin controllers)
    // -------------------------------------------------------------------------

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
        validateChildTicketPricingAllowed(movie, request.childStandardPrice(), request.childVipPrice(), request.childCouplePrice());
        validateInitialStatus(request.status());

        Showtime showtime = new Showtime(movie, room, request.startTime(), endTime, request.basePrice());
        applyPricing(showtime, request);
        showtime.setStatus(request.status() == null ? ShowtimeStatus.SCHEDULED : request.status());
        return cinemaMapper.toShowtimeResponse(showtimeRepository.save(showtime));
    }

    /**
     * Bulk showtime creation — all slots run inside one transaction.
     * If any slot fails validation the whole batch is rolled back.
     * Movie-level validation (INACTIVE check) is done once up front.
     * Each slot independently validates room status, time in future, and overlap.
     */
    @Transactional
    public List<ShowtimeResponse> createBulk(BulkShowtimeRequest request) {
        Movie movie = findMovie(request.movieId());
        if (movie.getStatus() == MovieStatus.INACTIVE) {
            throw new BadRequestException("Cannot schedule inactive movie");
        }
        validateChildTicketPricingAllowed(movie, request.childStandardPrice(), request.childVipPrice(), request.childCouplePrice());
        validateInitialStatus(request.defaultStatus());

        ShowtimeStatus fallbackStatus = request.defaultStatus() == null
                ? ShowtimeStatus.SCHEDULED
                : request.defaultStatus();

        List<ShowtimeResponse> results = new java.util.ArrayList<>();

        Set<String> roomStartTimesInRequest = new HashSet<>();
        for (int i = 0; i < request.slots().size(); i++) {
            BulkShowtimeRequest.Slot slot = request.slots().get(i);
            String slotLabel = "Slot " + (i + 1);
            Room room = roomService.findById(slot.roomId());

            if (room.getStatus() != RoomStatus.ACTIVE) {
                throw new BadRequestException(slotLabel + ": room " + room.getName() + " is not active");
            }
            if (!slot.startTime().isAfter(LocalDateTime.now())) {
                throw new BadRequestException(slotLabel + ": start time must be in the future");
            }
            if (!roomStartTimesInRequest.add(slot.roomId() + "|" + slot.startTime())) {
                throw new ConflictException(slotLabel + ": room " + room.getName()
                        + " already has another selected slot at " + slot.startTime());
            }
            LocalDateTime endTime = calculateEndTime(movie, slot.startTime());
            if (hasOverlappingShowtime(room, slot.startTime(), endTime, null)) {
                throw new ConflictException(slotLabel + ": room " + room.getName()
                        + " already has an overlapping showtime at " + slot.startTime());
            }

            ShowtimeStatus slotStatus = slot.status() != null ? slot.status() : fallbackStatus;
            validateInitialStatus(slotStatus);

            Showtime showtime = new Showtime(movie, room, slot.startTime(), endTime, request.basePrice());
            applyPricing(showtime, request);
            showtime.setStatus(slotStatus);
            results.add(cinemaMapper.toShowtimeResponse(showtimeRepository.save(showtime)));
        }

        return results;
    }

    @Transactional
    public ShowtimeResponse update(Long id, ShowtimeRequest request) {
        Showtime showtime = findById(id);
        validateShowtimeCanBeUpdated(showtime);
        Movie movie = findMovie(request.movieId());
        Room room = roomService.findById(request.roomId());
        LocalDateTime endTime = calculateEndTime(movie, request.startTime());
        validateShowtime(movie, request.startTime(), room, endTime, id);
        validateChildTicketPricingAllowed(movie, request.childStandardPrice(), request.childVipPrice(), request.childCouplePrice());
        ShowtimeStatus requestedStatus = request.status() == null ? showtime.getStatus() : request.status();
        validateStatusTransition(showtime, requestedStatus);

        showtime.setStartTime(request.startTime());
        showtime.setEndTime(endTime);
        applyPricing(showtime, request);
        showtime.setStatus(requestedStatus);
        return cinemaMapper.toShowtimeResponse(showtime);
    }

    @Transactional
    public ShowtimeResponse updateStatus(Long id, ShowtimeStatus status) {
        Showtime showtime = findById(id);
        validateStatusTransition(showtime, status);
        if (status == ShowtimeStatus.CANCELLED) {
            // Auto-handle all bookings when admin cancels a showtime
            cancelShowtimeBookings(showtime);
        }
        showtime.setStatus(status);
        return cinemaMapper.toShowtimeResponse(showtime);
    }

    /**
     * Admin hard-delete: permanently removes the showtime from DB.
     * Rejected with 409 if any active bookings still exist.
     * Recommended flow: PATCH status=CANCELLED first (which auto-handles bookings),
     * then DELETE if a full purge is needed.
     */
    @Transactional
    public void delete(Long id) {
        Showtime showtime = findById(id);
        if (hasActiveBookings(showtime)) {
            throw new ConflictException(
                    "Cannot delete showtime because it has active bookings. Cancel the showtime first.");
        }
        showtimeRepository.delete(showtime);
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
                .collect(Collectors.toMap(
                        bookingSeat -> bookingSeat.getSeat().getId(),
                        Function.identity(),
                        (left, right) -> left
                ));

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

    // -------------------------------------------------------------------------
    // PRIVATE HELPERS
    // -------------------------------------------------------------------------

    private List<Showtime> search(Long movieId, Long roomId, LocalDate date) {
        LocalDateTime from = date == null ? LocalDate.now().atStartOfDay()              : date.atStartOfDay();
        LocalDateTime to   = date == null ? LocalDate.now().plusYears(1).atStartOfDay() : date.plusDays(1).atStartOfDay();
        return showtimeRepository.findByStartTimeBetween(from, to)
                .stream()
                .filter(showtime -> movieId == null || showtime.getMovie().getId().equals(movieId))
                .filter(showtime -> roomId  == null || showtime.getRoom().getId().equals(roomId))
                .sorted(Comparator.comparing(Showtime::getStartTime))
                .toList();
    }

    private Pageable pageable(int page, int size, Sort sort) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, 100));
        return PageRequest.of(safePage, safeSize, sort);
    }

    private void validateShowtime(Movie movie, LocalDateTime startTime, Room room,
                                  LocalDateTime endTime, Long excludeId) {
        if (movie.getStatus() == MovieStatus.INACTIVE) {
            throw new BadRequestException("Cannot schedule inactive movie");
        }
        if (room.getStatus() != RoomStatus.ACTIVE) {
            throw new BadRequestException("Cannot schedule showtime in room " + room.getName() + " because it is not active");
        }
        if (!startTime.isAfter(LocalDateTime.now())) {
            throw new BadRequestException("Showtime start time must be in the future");
        }
        if (!endTime.isAfter(startTime)) {
            throw new BadRequestException("Showtime end time must be after start time");
        }
        if (hasOverlappingShowtime(room, startTime, endTime, excludeId)) {
            throw new ConflictException("Room " + room.getName() + " already has an overlapping showtime");
        }
    }

    private boolean hasOverlappingShowtime(Room room, LocalDateTime startTime,
                                           LocalDateTime endTime, Long excludeId) {
        return showtimeRepository.existsOverlapping(room, startTime, endTime, excludeId);
    }

    private void validateChildTicketPricingAllowed(
            Movie movie,
            java.math.BigDecimal childStandardPrice,
            java.math.BigDecimal childVipPrice,
            java.math.BigDecimal childCouplePrice
    ) {
        if (movie.getAgeRating() == null || movie.getAgeRating().getMinimumAge() < 16) {
            return;
        }
        if (childStandardPrice != null || childVipPrice != null || childCouplePrice != null) {
            throw new BadRequestException("Child tickets are not allowed for movies rated 16+ or higher");
        }
    }

    private void validateInitialStatus(ShowtimeStatus status) {
        if (status == ShowtimeStatus.CANCELLED || status == ShowtimeStatus.COMPLETED) {
            throw new BadRequestException("New showtime status must be SCHEDULED or OPEN");
        }
    }

    private void validateShowtimeCanBeUpdated(Showtime showtime) {
        if (showtime.getStatus() == ShowtimeStatus.CANCELLED) {
            throw new BadRequestException("Cannot update a cancelled showtime");
        }
        if (showtime.getStatus() == ShowtimeStatus.COMPLETED) {
            throw new BadRequestException("Cannot update a completed showtime");
        }
        if (hasActiveBookings(showtime)) {
            throw new ConflictException("Cannot update showtime because it has active bookings");
        }
    }

    private void validateStatusTransition(Showtime showtime, ShowtimeStatus requestedStatus) {
        if (requestedStatus == null) {
            throw new BadRequestException("Showtime status is required");
        }
        ShowtimeStatus currentStatus = showtime.getStatus();
        if (currentStatus == requestedStatus) {
            return; // no-op
        }
        // Terminal states — nothing can leave them
        if (currentStatus == ShowtimeStatus.CANCELLED) {
            throw new BadRequestException("Cannot change status of a cancelled showtime");
        }
        if (currentStatus == ShowtimeStatus.COMPLETED) {
            throw new BadRequestException("Cannot change status of a completed showtime");
        }
        // Guard: cannot mark completed before the show ends
        if (requestedStatus == ShowtimeStatus.COMPLETED
                && LocalDateTime.now().isBefore(showtime.getEndTime())) {
            throw new BadRequestException("Cannot complete a showtime before it has ended");
        }
        // Guard: SCHEDULED can only go to OPEN or CANCELLED
        if (currentStatus == ShowtimeStatus.SCHEDULED
                && requestedStatus != ShowtimeStatus.OPEN
                && requestedStatus != ShowtimeStatus.CANCELLED) {
            throw new BadRequestException(
                    "SCHEDULED showtime can only transition to OPEN or CANCELLED");
        }
        // Guard: OPEN can only go to COMPLETED or CANCELLED
        if (currentStatus == ShowtimeStatus.OPEN
                && requestedStatus != ShowtimeStatus.COMPLETED
                && requestedStatus != ShowtimeStatus.CANCELLED) {
            throw new BadRequestException(
                    "OPEN showtime can only transition to COMPLETED or CANCELLED");
        }
    }

    private boolean hasActiveBookings(Showtime showtime) {
        return bookingRepository.existsByShowtimeAndStatusIn(showtime, ACTIVE_BOOKING_STATUSES);
    }

    /**
     * Cascade-cancels all non-terminal bookings when admin cancels a showtime due to incident.
     * <ul>
     *   <li>HOLDING / PENDING_PAYMENT  → CANCELLED  (no money collected)</li>
     *   <li>PAID  → REFUNDED: mark refunded, revoke loyalty, send notification</li>
     *   <li>REFUND_REQUESTED → REFUNDED: complete the pending refund</li>
     *   <li>USED / CANCELLED / REFUNDED / EXPIRED → skipped (terminal)</li>
     * </ul>
     */
    private void cancelShowtimeBookings(Showtime showtime) {
        bookingRepository.findByShowtime(showtime).forEach(booking -> {
            switch (booking.getStatus()) {
                case HOLDING, PENDING_PAYMENT -> {
                    cancelBooking(booking);
                    notificationService.notifyBookingCancelled(booking);
                }
                case PAID, REFUND_REQUESTED -> processShowtimeRefund(booking, showtime);
                default -> { /* already terminal — no action */ }
            }
        });
    }

    private void processShowtimeRefund(Booking booking, Showtime showtime) {
        booking.setStatus(BookingStatus.REFUNDED);
        booking.setRefundedAt(java.time.LocalDateTime.now());
        booking.setRefundReason("Showtime cancelled by admin due to operational incident");
        loyaltyPointService.revokePointsFromBooking(booking.getUser(), booking);
        notificationService.notifyShowtimeCancelled(booking.getUser(), booking, showtime);
    }

    private LocalDateTime calculateEndTime(Movie movie, LocalDateTime startTime) {
        return startTime.plusMinutes(movie.getDurationMinutes()).plusMinutes(CLEANUP_MINUTES);
    }

    private void applyPricing(Showtime showtime, ShowtimeRequest request) {
        changePrices(showtime, request.basePrice(), request.vipPrice(), request.couplePrice());
        changeTicketPrices(
                showtime,
                request.adultStandardPrice(),
                request.childStandardPrice(),
                request.studentStandardPrice(),
                request.adultVipPrice(),
                request.childVipPrice(),
                request.studentVipPrice(),
                request.adultCouplePrice(),
                request.childCouplePrice(),
                request.studentCouplePrice(),
                Boolean.TRUE.equals(request.weekendSurcharge()),
                Boolean.TRUE.equals(request.holidaySurcharge())
        );
    }

    private void applyPricing(Showtime showtime, BulkShowtimeRequest request) {
        changePrices(showtime, request.basePrice(), request.vipPrice(), request.couplePrice());
        changeTicketPrices(
                showtime,
                request.adultStandardPrice(),
                request.childStandardPrice(),
                request.studentStandardPrice(),
                request.adultVipPrice(),
                request.childVipPrice(),
                request.studentVipPrice(),
                request.adultCouplePrice(),
                request.childCouplePrice(),
                request.studentCouplePrice(),
                Boolean.TRUE.equals(request.weekendSurcharge()),
                Boolean.TRUE.equals(request.holidaySurcharge())
        );
    }

    private void changePrices(Showtime showtime, java.math.BigDecimal basePrice,
                              java.math.BigDecimal vipPrice, java.math.BigDecimal couplePrice) {
        showtime.setBasePrice(basePrice);
        showtime.setVipPrice(vipPrice);
        showtime.setCouplePrice(couplePrice);
        showtime.setAdultStandardPrice(basePrice);
        showtime.setAdultVipPrice(vipPrice != null ? vipPrice : basePrice.add(java.math.BigDecimal.valueOf(20_000)));
        showtime.setAdultCouplePrice(couplePrice != null ? couplePrice : basePrice.add(java.math.BigDecimal.valueOf(30_000)));
    }

    private void changeTicketPrices(
            Showtime showtime,
            java.math.BigDecimal adultStandardPrice,
            java.math.BigDecimal childStandardPrice,
            java.math.BigDecimal studentStandardPrice,
            java.math.BigDecimal adultVipPrice,
            java.math.BigDecimal childVipPrice,
            java.math.BigDecimal studentVipPrice,
            java.math.BigDecimal adultCouplePrice,
            java.math.BigDecimal childCouplePrice,
            java.math.BigDecimal studentCouplePrice,
            boolean weekendSurcharge,
            boolean holidaySurcharge
    ) {
        java.math.BigDecimal adultStandard = defaultMoney(adultStandardPrice, showtime.getBasePrice());
        java.math.BigDecimal childStandard = defaultMoney(childStandardPrice, adultStandard);
        java.math.BigDecimal studentStandard = defaultMoney(studentStandardPrice, adultStandard);
        java.math.BigDecimal adultVip = defaultMoney(adultVipPrice, adultStandard.add(java.math.BigDecimal.valueOf(20_000)));
        java.math.BigDecimal childVip = defaultMoney(childVipPrice, childStandard.add(java.math.BigDecimal.valueOf(20_000)));
        java.math.BigDecimal studentVip = defaultMoney(studentVipPrice, studentStandard.add(java.math.BigDecimal.valueOf(20_000)));
        java.math.BigDecimal adultCouple = defaultMoney(adultCouplePrice, adultStandard.add(java.math.BigDecimal.valueOf(30_000)));
        java.math.BigDecimal childCouple = defaultMoney(childCouplePrice, childStandard.add(java.math.BigDecimal.valueOf(30_000)));
        java.math.BigDecimal studentCouple = defaultMoney(studentCouplePrice, studentStandard.add(java.math.BigDecimal.valueOf(30_000)));

        showtime.setAdultStandardPrice(adultStandard);
        showtime.setChildStandardPrice(childStandard);
        showtime.setStudentStandardPrice(studentStandard);
        showtime.setAdultVipPrice(adultVip);
        showtime.setChildVipPrice(childVip);
        showtime.setStudentVipPrice(studentVip);
        showtime.setAdultCouplePrice(adultCouple);
        showtime.setChildCouplePrice(childCouple);
        showtime.setStudentCouplePrice(studentCouple);
        showtime.setWeekendSurcharge(weekendSurcharge);
        showtime.setHolidaySurcharge(holidaySurcharge);
        showtime.setBasePrice(adultStandard);
        showtime.setVipPrice(adultVip);
        showtime.setCouplePrice(adultCouple);
    }

    private java.math.BigDecimal defaultMoney(java.math.BigDecimal value, java.math.BigDecimal fallback) {
        return value != null ? value : fallback;
    }

    private void cancelBooking(com.sba301.cinemaai.entity.Booking booking) {
        booking.setCancelledAt(LocalDateTime.now());
        booking.setStatus(BookingStatus.CANCELLED);
    }

    private void requestRefund(com.sba301.cinemaai.entity.Booking booking, String reason) {
        booking.setRefundRequestedAt(LocalDateTime.now());
        booking.setRefundReason(reason);
        booking.setStatus(BookingStatus.REFUND_REQUESTED);
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
