package com.sba301.cinemaai.service.impl;

import com.sba301.cinemaai.dto.request.booking.BookingFoodRequest;
import com.sba301.cinemaai.dto.response.booking.BookingResponse;
import com.sba301.cinemaai.dto.request.booking.CreateBookingRequest;
import com.sba301.cinemaai.dto.request.booking.HoldSeatsRequest;
import com.sba301.cinemaai.dto.response.ticket.TicketLinePriceResponse;
import com.sba301.cinemaai.dto.request.ticket.TicketPriceValidationRequest;
import com.sba301.cinemaai.dto.request.ticket.TicketSelectionRequest;
import com.sba301.cinemaai.dto.response.ticket.TicketPriceValidationResponse;
import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.BookingFoodItem;
import com.sba301.cinemaai.entity.BookingSeat;
import com.sba301.cinemaai.entity.BookingTicket;
import com.sba301.cinemaai.entity.FoodCombo;
import com.sba301.cinemaai.entity.FoodItem;
import com.sba301.cinemaai.entity.Seat;
import com.sba301.cinemaai.entity.Showtime;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.enums.BookingStatus;
import com.sba301.cinemaai.enums.FoodItemStatus;
import com.sba301.cinemaai.enums.SeatType;
import com.sba301.cinemaai.enums.SeatRuntimeStatus;
import com.sba301.cinemaai.enums.SeatStatus;
import com.sba301.cinemaai.enums.ShowtimeStatus;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.ConflictException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.mapper.BookingMapper;
import com.sba301.cinemaai.repository.BookingFoodItemRepository;
import com.sba301.cinemaai.repository.BookingRepository;
import com.sba301.cinemaai.repository.BookingSeatRepository;
import com.sba301.cinemaai.repository.BookingTicketRepository;
import com.sba301.cinemaai.repository.ReviewRepository;
import com.sba301.cinemaai.repository.SeatRepository;
import com.sba301.cinemaai.repository.ShowtimeRepository;
import com.sba301.cinemaai.dto.response.PageResponse;
import com.sba301.cinemaai.service.BookingService;
import com.sba301.cinemaai.service.FoodService;
import com.sba301.cinemaai.service.LoyaltyPointService;
import com.sba301.cinemaai.service.QrTicketService;
import com.sba301.cinemaai.service.TicketPricingService;
import com.sba301.cinemaai.service.UserService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
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
public class BookingServiceImpl implements BookingService {

    private static final int HOLD_MINUTES = 10;
    private static final List<SeatRuntimeStatus> BLOCKING_SEAT_STATUSES = List.of(
            SeatRuntimeStatus.HOLDING,
            SeatRuntimeStatus.BOOKED,
            SeatRuntimeStatus.CHECKED_IN
    );

    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final BookingTicketRepository bookingTicketRepository;
    private final BookingFoodItemRepository bookingFoodItemRepository;
    private final ShowtimeRepository showtimeRepository;
    private final SeatRepository seatRepository;
    private final UserService userService;
    private final FoodService foodService;
    private final TicketPricingService ticketPricingService;
    private final QrTicketService qrTicketService;
    private final BookingMapper bookingMapper;
    private final LoyaltyPointService loyaltyPointService;
    private final ReviewRepository reviewRepository;

    @Transactional
    public BookingResponse holdSeats(String email, HoldSeatsRequest request) {
        releaseExpiredHolds();
        User user = userService.getByEmail(email);
        Showtime showtime = findShowtime(request.showtimeId());
        if (showtime.getStatus() != ShowtimeStatus.OPEN) {
            throw new BadRequestException("Showtime is not open for booking");
        }

        Booking booking = bookingRepository.save(new Booking(newBookingCode(), user, showtime,
                LocalDateTime.now().plusMinutes(HOLD_MINUTES)));
        BigDecimal subtotal = BigDecimal.ZERO;

        for (Long seatId : request.seatIds().stream().distinct().toList()) {
            Seat seat = findSeat(seatId);
            validateSeatForShowtime(showtime, seat);
            BigDecimal unitPrice = showtime.getPriceForSeatType(seat.getSeatType());
            BookingSeat bookingSeat = bookingSeatRepository.save(new BookingSeat(booking, showtime, seat, unitPrice));
            subtotal = subtotal.add(bookingSeat.getUnitPrice());
        }

        if (request.tickets() != null && !request.tickets().isEmpty()) {
            subtotal = applyTicketSelections(booking, request.comboId(), request.holiday(), request.tickets());
        }
        if (request.foods() != null) {
            for (BookingFoodRequest foodRequest : request.foods()) {
                BookingFoodItem item = createFoodItem(booking, foodRequest);
                bookingFoodItemRepository.save(item);
                subtotal = subtotal.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }

        booking.setSubtotal(subtotal);
        booking.setDiscountAmount(BigDecimal.ZERO);
        booking.setTotalAmount(subtotal);
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse createBooking(String email, CreateBookingRequest request) {
        releaseExpiredHolds();
        User user = userService.getByEmail(email);
        Booking booking = findBooking(request.holdBookingId());
        validateOwner(booking, user);
        if (booking.getStatus() != BookingStatus.HOLDING) {
            throw new BadRequestException("Booking is not in holding status");
        }
        if (booking.getHoldExpiresAt() != null && booking.getHoldExpiresAt().isBefore(LocalDateTime.now())) {
            expireBooking(booking);
            throw new BadRequestException("Seat hold has expired");
        }

        BigDecimal subtotal = booking.getSubtotal();
        if (request.tickets() != null && !request.tickets().isEmpty()) {
            subtotal = applyTicketSelections(booking, request.comboId(), request.holiday(), request.tickets());
        }
        if (request.foods() != null) {
            for (BookingFoodRequest foodRequest : request.foods()) {
                BookingFoodItem item = createFoodItem(booking, foodRequest);
                bookingFoodItemRepository.save(item);
                subtotal = subtotal.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }

        bookingSeatRepository.findByBooking(booking)
                .forEach(seat -> changeBookingSeatStatus(seat, SeatRuntimeStatus.BOOKED));
        BigDecimal discount = booking.getDiscountAmount();
        booking.setSubtotal(subtotal);
        booking.setDiscountAmount(discount);
        booking.setTotalAmount(subtotal.subtract(discount));
        markPendingPayment(booking);
        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> getMyBookings(String email, int page, int size) {
        User user = userService.getByEmail(email);
        return PageResponse.from(bookingRepository.findByUser(user, bookingPageable(page, size)).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> getAdminBookings(BookingStatus status, int page, int size) {
        Pageable pageable = bookingPageable(page, size);
        return PageResponse.from((status == null
                ? bookingRepository.findAll(pageable)
                : bookingRepository.findByStatus(status, pageable)).map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public BookingResponse getMyBooking(String email, Long bookingId) {
        User user = userService.getByEmail(email);
        Booking booking = findBooking(bookingId);
        validateOwner(booking, user);
        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public BookingResponse getAdminBooking(Long bookingId) {
        return toResponse(findBooking(bookingId));
    }

    @Transactional
    public BookingResponse cancel(String email, Long bookingId) {
        User user = userService.getByEmail(email);
        Booking booking = findBooking(bookingId);
        validateOwner(booking, user);
        return cancelBooking(booking);
    }

    @Transactional
    public BookingResponse requestRefund(String email, Long bookingId, String reason) {
        User user = userService.getByEmail(email);
        Booking booking = findBooking(bookingId);
        validateOwner(booking, user);
        validateRefundable(booking);
        requestRefund(booking, reason);
        releaseSeats(booking);
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse requestRefundAdmin(Long bookingId, String reason) {
        Booking booking = findBooking(bookingId);
        validateRefundable(booking);
        requestRefund(booking, reason);
        releaseSeats(booking);
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse markRefunded(Long bookingId) {
        Booking booking = findBooking(bookingId);
        if (booking.getStatus() != BookingStatus.REFUND_REQUESTED) {
            throw new BadRequestException("Only refund requested booking can be marked as refunded");
        }
        markRefunded(booking);
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse cancelAdmin(Long bookingId) {
        return cancelBooking(findBooking(bookingId));
    }

    private BookingResponse cancelBooking(Booking booking) {
        if (booking.getStatus() == BookingStatus.USED) {
            throw new BadRequestException("Checked-in booking cannot be cancelled");
        }
        releaseSeats(booking);
        cancel(booking);
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse checkIn(String qrCode) {
        String bookingCode;
        try {
            bookingCode = qrTicketService.extractBookingCode(qrCode);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException(exception.getMessage());
        }
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        if (booking.getStatus() != BookingStatus.PAID) {
            throw new BadRequestException("Only paid booking can be checked in");
        }
        checkIn(booking);
        bookingSeatRepository.findByBooking(booking)
                .forEach(seat -> changeBookingSeatStatus(seat, SeatRuntimeStatus.CHECKED_IN));
        return toResponse(booking);
    }

    @Transactional
    public BookingResponse checkInAdmin(Long bookingId, String qrCode) {
        Booking booking = findBooking(bookingId);
        if (qrCode != null && !qrCode.isBlank()) {
            String bookingCode;
            try {
                bookingCode = qrTicketService.extractBookingCode(qrCode);
            } catch (IllegalArgumentException exception) {
                throw new BadRequestException(exception.getMessage());
            }
            if (!booking.getBookingCode().equals(bookingCode)) {
                throw new BadRequestException("QR code does not match booking");
            }
        }
        if (booking.getStatus() != BookingStatus.PAID) {
            throw new BadRequestException("Only paid booking can be checked in");
        }
        checkIn(booking);
        bookingSeatRepository.findByBooking(booking)
                .forEach(seat -> changeBookingSeatStatus(seat, SeatRuntimeStatus.CHECKED_IN));
        return toResponse(booking);
    }

    @Transactional
    public int releaseExpiredHolds() {
        List<Booking> expiredBookings = bookingRepository.findByStatusAndHoldExpiresAtBefore(
                BookingStatus.HOLDING,
                LocalDateTime.now()
        );
        expiredBookings.addAll(bookingRepository.findByStatusAndHoldExpiresAtBefore(
                BookingStatus.PENDING_PAYMENT,
                LocalDateTime.now()
        ));
        expiredBookings.forEach(this::expireBooking);
        return expiredBookings.size();
    }

    @Transactional(readOnly = true)
    public BookingResponse lookupForCheckIn(String bookingCode, String qrCode) {
        String resolvedCode = bookingCode;
        if ((resolvedCode == null || resolvedCode.isBlank()) && qrCode != null && !qrCode.isBlank()) {
            try {
                resolvedCode = qrTicketService.extractBookingCode(qrCode);
            } catch (IllegalArgumentException exception) {
                throw new BadRequestException(exception.getMessage());
            }
        }
        if (resolvedCode == null || resolvedCode.isBlank()) {
            throw new BadRequestException("Booking code or QR code is required");
        }
        Booking booking = bookingRepository.findByBookingCode(resolvedCode.trim())
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        return toResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getStaffBookingsByShowtime(Long showtimeId) {
        Showtime showtime = findShowtime(showtimeId);
        return bookingRepository.findByShowtime(showtime)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private BigDecimal applyTicketSelections(
            Booking booking,
            Long comboId,
            boolean holiday,
            List<TicketSelectionRequest> tickets
    ) {
        validateTicketSelectionsMatchHeldSeats(booking, tickets);
        TicketPriceValidationResponse validation = ticketPricingService.validatePrice(new TicketPriceValidationRequest(
                booking.getShowtime().getId(),
                comboId,
                holiday,
                tickets
        ));
        if (!validation.eligible()) {
            throw new BadRequestException("Ticket selection is not eligible for this movie/showtime");
        }
        bookingTicketRepository.findByBooking(booking).forEach(bookingTicketRepository::delete);
        Map<Long, BookingSeat> seatsById = bookingSeatRepository.findByBooking(booking)
                .stream()
                .collect(Collectors.toMap(
                        bookingSeat -> bookingSeat.getSeat().getId(),
                        Function.identity()
                ));
        for (int i = 0; i < validation.tickets().size(); i++) {
            TicketLinePriceResponse ticket = validation.tickets().get(i);
            bookingTicketRepository.save(new BookingTicket(
                    booking,
                    ticket.ticketType(),
                    ticket.viewerAge(),
                    ticket.quantity(),
                    ticket.unitPrice(),
                    ticket.lineTotal()
            ));
            Long seatId = tickets.get(i).seatId();
            if (seatId != null && ticket.quantity() == 1) {
                BookingSeat bookingSeat = seatsById.get(seatId);
                if (bookingSeat != null) {
                    changeBookingSeatUnitPrice(bookingSeat, ticket.unitPrice());
                }
            }
        }
        return validation.finalAmount();
    }

    private void validateTicketSelectionsMatchHeldSeats(
            Booking booking,
            List<TicketSelectionRequest> tickets
    ) {
        List<BookingSeat> heldSeats = bookingSeatRepository.findByBooking(booking);
        int ticketQuantity = tickets.stream().mapToInt(ticket -> ticket.quantity()).sum();
        if (ticketQuantity != heldSeats.size()) {
            throw new BadRequestException("Ticket quantity must match held seat quantity");
        }

        boolean allTicketsHaveSeatId = tickets.stream().allMatch(ticket -> ticket.seatId() != null);
        if (allTicketsHaveSeatId) {
            Set<Long> heldSeatIds = heldSeats.stream()
                    .map(bookingSeat -> bookingSeat.getSeat().getId())
                    .collect(Collectors.toSet());
            Set<Long> ticketSeatIds = new HashSet<>();
            for (TicketSelectionRequest ticket : tickets) {
                if (ticket.quantity() != 1) {
                    throw new BadRequestException("Ticket quantity must be 1 when seatId is provided");
                }
                if (!ticketSeatIds.add(ticket.seatId())) {
                    throw new BadRequestException("Duplicate ticket seatId: " + ticket.seatId());
                }
            }
            if (!heldSeatIds.equals(ticketSeatIds)) {
                throw new BadRequestException("Ticket seat ids must match held seats");
            }
            return;
        }

        Map<SeatType, Integer> heldBySeatType = new EnumMap<>(SeatType.class);
        for (BookingSeat bookingSeat : heldSeats) {
            heldBySeatType.merge(normalizeSeatType(bookingSeat.getSeat().getSeatType()), 1, Integer::sum);
        }

        Map<SeatType, Integer> ticketsBySeatType = new EnumMap<>(SeatType.class);
        for (TicketSelectionRequest ticket : tickets) {
            ticketsBySeatType.merge(normalizeSeatType(ticket.seatType()), ticket.quantity(), Integer::sum);
        }

        if (!heldBySeatType.equals(ticketsBySeatType)) {
            throw new BadRequestException("Ticket seat types must match held seat types");
        }
    }

    private SeatType normalizeSeatType(SeatType seatType) {
        return seatType == SeatType.NORMAL ? SeatType.STANDARD : seatType;
    }

    private BookingFoodItem createFoodItem(Booking booking, BookingFoodRequest request) {
        if ((request.foodItemId() == null && request.foodComboId() == null)
                || (request.foodItemId() != null && request.foodComboId() != null)) {
            throw new BadRequestException("Choose exactly one food item or combo");
        }
        if (request.quantity() <= 0) {
            throw new BadRequestException("Quantity must be positive");
        }
        if (request.foodItemId() != null) {
            FoodItem foodItem = foodService.findItem(request.foodItemId());
            if (foodItem.getStatus() != FoodItemStatus.ACTIVE) {
                throw new BadRequestException("Food item is not available");
            }
            return new BookingFoodItem(booking, foodItem, null, request.quantity(), foodItem.getPrice());
        }
        FoodCombo foodCombo = foodService.findCombo(request.foodComboId());
        if (foodCombo.getStatus() != FoodItemStatus.ACTIVE) {
            throw new BadRequestException("Food combo is not available");
        }
        return new BookingFoodItem(booking, null, foodCombo, request.quantity(), foodCombo.getPrice());
    }

    private void validateSeatForShowtime(Showtime showtime, Seat seat) {
        if (!seat.getRoom().getId().equals(showtime.getRoom().getId())) {
            throw new BadRequestException("Seat does not belong to showtime room");
        }
        if (seat.getStatus() != SeatStatus.AVAILABLE) {
            throw new BadRequestException("Seat is not available");
        }
        boolean blocked = bookingSeatRepository
                .findByShowtimeAndSeatAndStatusIn(showtime, seat, BLOCKING_SEAT_STATUSES)
                .stream()
                .anyMatch(this::isBlockingSeat);
        if (blocked) {
            throw new ConflictException("Seat is already held or booked");
        }
    }

    private boolean isBlockingSeat(BookingSeat bookingSeat) {
        Booking booking = bookingSeat.getBooking();
        if (bookingSeat.getStatus() == SeatRuntimeStatus.HOLDING && booking.getStatus() == BookingStatus.HOLDING) {
            return booking.getHoldExpiresAt() == null || booking.getHoldExpiresAt().isAfter(LocalDateTime.now());
        }
        return bookingSeat.getStatus() == SeatRuntimeStatus.BOOKED
                || bookingSeat.getStatus() == SeatRuntimeStatus.CHECKED_IN;
    }

    private void expireBooking(Booking booking) {
        releaseSeats(booking);
        booking.setStatus(BookingStatus.EXPIRED);
    }

    private void releaseSeats(Booking booking) {
        bookingSeatRepository.findByBooking(booking)
                .forEach(seat -> changeBookingSeatStatus(seat, SeatRuntimeStatus.RELEASED));
    }

    private void validateRefundable(Booking booking) {
        if (booking.getStatus() != BookingStatus.PAID && booking.getStatus() != BookingStatus.CANCELLED) {
            throw new BadRequestException("Only paid or cancelled booking can request refund");
        }
        if (reviewRepository.existsByUserAndMovie(booking.getUser(), booking.getShowtime().getMovie())) {
            throw new BadRequestException("Reviewed movie cannot request refund");
        }
    }

    private void markPendingPayment(Booking booking) {
        requireStatus(booking, BookingStatus.HOLDING, "Only holding booking can move to pending payment");
        booking.setStatus(BookingStatus.PENDING_PAYMENT);
    }

    private void cancel(Booking booking) {
        booking.setCancelledAt(LocalDateTime.now());
        booking.setStatus(BookingStatus.CANCELLED);
    }

    private void checkIn(Booking booking) {
        requireStatus(booking, BookingStatus.PAID, "Only paid booking can be checked in");
        booking.setCheckedInAt(LocalDateTime.now());
        booking.setStatus(BookingStatus.USED);
    }

    private void requestRefund(Booking booking, String reason) {
        validateRefundable(booking);
        booking.setRefundRequestedAt(LocalDateTime.now());
        booking.setRefundReason(reason);
        booking.setStatus(BookingStatus.REFUND_REQUESTED);
    }

    private void markRefunded(Booking booking) {
        requireStatus(booking, BookingStatus.REFUND_REQUESTED, "Only refund requested booking can be marked as refunded");
        booking.setRefundedAt(LocalDateTime.now());
        booking.setStatus(BookingStatus.REFUNDED);
    }

    private void changeBookingSeatStatus(BookingSeat bookingSeat, SeatRuntimeStatus status) {
        if (status == null) {
            throw new BadRequestException("Seat runtime status is required");
        }
        bookingSeat.setStatus(status);
    }

    private void changeBookingSeatUnitPrice(BookingSeat bookingSeat, BigDecimal unitPrice) {
        if (unitPrice == null || unitPrice.signum() < 0) {
            throw new BadRequestException("Seat unit price must not be null or negative");
        }
        bookingSeat.setUnitPrice(unitPrice);
    }

    private void requireStatus(Booking booking, BookingStatus expectedStatus, String message) {
        if (booking.getStatus() != expectedStatus) {
            throw new BadRequestException(message);
        }
    }

    private BookingResponse toResponse(Booking booking) {
        return bookingMapper.toResponse(
                booking,
                bookingSeatRepository.findByBooking(booking),
                bookingTicketRepository.findByBooking(booking),
                bookingFoodItemRepository.findByBooking(booking)
        );
    }

    private void validateOwner(Booking booking, User user) {
        if (!booking.getUser().getId().equals(user.getId())) {
            throw new NotFoundException("Booking not found");
        }
    }

    private Showtime findShowtime(Long id) {
        return showtimeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Showtime not found"));
    }

    private Seat findSeat(Long id) {
        return seatRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Seat not found"));
    }

    private Booking findBooking(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
    }

    private Pageable bookingPageable(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, 100));
        return PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    private String newBookingCode() {
        return "BK" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }
}
