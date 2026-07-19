package com.sba301.cinemaai.service.impl;

import com.sba301.cinemaai.dto.request.booking.BookingFoodRequest;
import com.sba301.cinemaai.dto.request.booking.FoodOrderRequest;
import com.sba301.cinemaai.dto.response.booking.BookingFoodResponse;
import com.sba301.cinemaai.dto.response.booking.FoodOrderResponse;
import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.BookingFoodItem;
import com.sba301.cinemaai.entity.BookingSeat;
import com.sba301.cinemaai.entity.FoodCombo;
import com.sba301.cinemaai.entity.FoodItem;
import com.sba301.cinemaai.entity.FoodOrder;
import com.sba301.cinemaai.entity.Payment;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.enums.AuditActionType;
import com.sba301.cinemaai.enums.BookingStatus;
import com.sba301.cinemaai.enums.FoodItemStatus;
import com.sba301.cinemaai.enums.FoodOrderStatus;
import com.sba301.cinemaai.enums.PaymentProvider;
import com.sba301.cinemaai.enums.PaymentStatus;
import com.sba301.cinemaai.enums.ShowtimeStatus;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.repository.BookingFoodItemRepository;
import com.sba301.cinemaai.repository.BookingRepository;
import com.sba301.cinemaai.repository.BookingSeatRepository;
import com.sba301.cinemaai.repository.FoodOrderRepository;
import com.sba301.cinemaai.repository.PaymentRepository;
import com.sba301.cinemaai.service.AuditLogService;
import com.sba301.cinemaai.service.FoodOrderService;
import com.sba301.cinemaai.service.FoodService;
import com.sba301.cinemaai.service.QrTicketService;
import com.sba301.cinemaai.service.UserService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FoodOrderServiceImpl implements FoodOrderService {

    private static final List<FoodItemStatus> SELLABLE_FOOD_STATUSES = List.of(
            FoodItemStatus.ACTIVE,
            FoodItemStatus.LOW_STOCK
    );

    private final FoodOrderRepository foodOrderRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final BookingFoodItemRepository bookingFoodItemRepository;
    private final PaymentRepository paymentRepository;
    private final FoodService foodService;
    private final UserService userService;
    private final QrTicketService qrTicketService;
    private final AuditLogService auditLogService;

    @Transactional
    public FoodOrderResponse create(String email, Long bookingId, FoodOrderRequest request) {
        User user = userService.getByEmail(email);
        Booking booking = findBooking(bookingId);
        if (!booking.getUser().getId().equals(user.getId())) {
            throw new NotFoundException("Booking not found");
        }
        return toResponse(createOrder(booking, request, false));
    }

    @Transactional(readOnly = true)
    public List<FoodOrderResponse> listByBooking(String email, Long bookingId) {
        User user = userService.getByEmail(email);
        Booking booking = findBooking(bookingId);
        if (!booking.getUser().getId().equals(user.getId())) {
            throw new NotFoundException("Booking not found");
        }
        return foodOrderRepository.findByBooking(booking).stream().map(this::toResponse).toList();
    }

    @Transactional
    public FoodOrderResponse createStaffOrder(String bookingOrTicketCode, FoodOrderRequest request) {
        Booking booking = resolveBookingByCode(bookingOrTicketCode);
        FoodOrder order = createOrder(booking, request, true);

        // Quầy nhận TIỀN MẶT: staff bấm xác nhận mới ghi nhận — provider CASH để
        // tách bạch với thanh toán demo trong báo cáo doanh thu
        Payment payment = new Payment(booking, PaymentProvider.CASH, order.getTotalAmount());
        payment.setFoodOrder(order);
        payment.setPaymentAccountLabel("Tiền mặt tại quầy");
        payment.setTransactionId("STAFF-" + System.currentTimeMillis());
        payment.setPaidAt(LocalDateTime.now());
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);
        order.setStatus(FoodOrderStatus.PAID);
        order.setPaidAt(LocalDateTime.now());
        auditLogService.record(AuditActionType.CREATE, "FOOD_ORDER", order.getId(),
                order.getOrderCode() + " - " + order.getTotalAmount() + " VND");
        return toResponse(order);
    }

    private FoodOrder createOrder(Booking booking, FoodOrderRequest request, boolean byStaff) {
        validateOrderable(booking);
        FoodOrder order = foodOrderRepository.save(new FoodOrder(booking, newOrderCode(), byStaff));
        BigDecimal total = BigDecimal.ZERO;
        for (BookingFoodRequest foodRequest : request.foods()) {
            BookingFoodItem item = buildFoodItem(booking, foodRequest);
            item.setFoodOrder(order);
            bookingFoodItemRepository.save(item);
            total = total.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        order.setTotalAmount(total);
        return order;
    }

    private void validateOrderable(Booking booking) {
        if (booking.getStatus() != BookingStatus.PAID && booking.getStatus() != BookingStatus.USED) {
            throw new BadRequestException("Only paid or checked-in bookings can order more food");
        }
        var showtime = booking.getShowtime();
        if (showtime.getStatus() == ShowtimeStatus.CANCELLED || showtime.getStatus() == ShowtimeStatus.COMPLETED) {
            throw new BadRequestException("Showtime has ended - food ordering is closed");
        }
        if (showtime.getEndTime() != null && LocalDateTime.now().isAfter(showtime.getEndTime())) {
            throw new BadRequestException("Showtime has ended - food ordering is closed");
        }
    }

    private BookingFoodItem buildFoodItem(Booking booking, BookingFoodRequest request) {
        if ((request.foodItemId() == null && request.foodComboId() == null)
                || (request.foodItemId() != null && request.foodComboId() != null)) {
            throw new BadRequestException("Choose exactly one food item or combo");
        }
        if (request.quantity() <= 0) {
            throw new BadRequestException("Quantity must be positive");
        }
        if (request.foodItemId() != null) {
            FoodItem foodItem = foodService.findItem(request.foodItemId());
            if (!SELLABLE_FOOD_STATUSES.contains(foodItem.getStatus())) {
                throw new BadRequestException("Food item is not available");
            }
            return new BookingFoodItem(booking, foodItem, null, request.quantity(), foodItem.getPrice());
        }
        FoodCombo foodCombo = foodService.findCombo(request.foodComboId());
        if (!SELLABLE_FOOD_STATUSES.contains(foodCombo.getStatus())) {
            throw new BadRequestException("Food combo is not available");
        }
        return new BookingFoodItem(booking, null, foodCombo, request.quantity(), foodCombo.getPrice());
    }

    private Booking resolveBookingByCode(String code) {
        if (code == null || code.isBlank()) {
            throw new BadRequestException("Booking code or ticket code is required");
        }
        String resolved = code.trim();
        if (resolved.startsWith("CINEAI:")) {
            QrTicketService.QrPayload payload = qrTicketService.parse(resolved);
            resolved = payload.code();
        }
        String trimmed = resolved;
        return bookingRepository.findByBookingCode(trimmed)
                .or(() -> bookingSeatRepository.findByTicketCode(trimmed).map(BookingSeat::getBooking))
                .orElseThrow(() -> new NotFoundException("Booking not found"));
    }

    private Booking findBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
    }

    private FoodOrderResponse toResponse(FoodOrder order) {
        List<BookingFoodResponse> items = bookingFoodItemRepository.findByBooking(order.getBooking())
                .stream()
                .filter(item -> item.getFoodOrder() != null && item.getFoodOrder().getId().equals(order.getId()))
                .map(item -> {
                    String name = item.getFoodItem() != null ? item.getFoodItem().getName() : item.getFoodCombo().getName();
                    return new BookingFoodResponse(
                            item.getFoodItem() == null ? null : item.getFoodItem().getId(),
                            item.getFoodCombo() == null ? null : item.getFoodCombo().getId(),
                            name,
                            item.getQuantity(),
                            item.getUnitPrice(),
                            item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                    );
                })
                .toList();
        return new FoodOrderResponse(
                order.getId(),
                order.getOrderCode(),
                order.getBooking().getId(),
                order.getBooking().getBookingCode(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getPaidAt(),
                order.isCreatedByStaff(),
                items
        );
    }

    private String newOrderCode() {
        return "FO" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
    }
}
