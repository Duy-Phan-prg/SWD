package com.sba301.cinemaai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sba301.cinemaai.dto.response.payment.PaymentResponse;
import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.Payment;
import com.sba301.cinemaai.enums.BookingStatus;
import com.sba301.cinemaai.enums.PaymentProvider;
import com.sba301.cinemaai.enums.PaymentStatus;
import com.sba301.cinemaai.enums.SeatRuntimeStatus;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.ConflictException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.repository.BookingRepository;
import com.sba301.cinemaai.repository.BookingSeatRepository;
import com.sba301.cinemaai.repository.PaymentRepository;
import java.math.BigDecimal;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final BookingSeatRepository bookingSeatRepository;
    private final VNPayService vnpayService;
    private final QrTicketService qrTicketService;
    private final LoyaltyPointService loyaltyPointService;
    private final ObjectMapper objectMapper;

    @Transactional
    public PaymentResponse createVnpayPayment(String email, Long bookingId, String clientIp) {
        Booking booking = findBooking(bookingId);
        validateBookingOwner(booking, email);

        if (booking.getStatus() != BookingStatus.HOLDING) {
            throw new BadRequestException("Only HOLDING bookings can be paid");
        }

        boolean alreadyPending = paymentRepository.findByBooking(booking)
                .stream()
                .anyMatch(p -> p.getStatus() == PaymentStatus.PENDING);
        if (alreadyPending) {
            throw new ConflictException("A pending payment already exists for this booking");
        }

        Payment payment = paymentRepository.save(new Payment(booking, PaymentProvider.VNPAY, booking.getTotalAmount()));

        String txnRef = payment.getId() + "-" + booking.getBookingCode();
        String orderInfo = "Thanh toan ve xem phim " + booking.getBookingCode();
        String paymentUrl = vnpayService.buildPaymentUrl(txnRef, booking.getTotalAmount(), orderInfo, clientIp);

        return toResponse(payment, paymentUrl);
    }

    @Transactional
    public String handleVnpayReturn(Map<String, String> params) {
        if (!vnpayService.verifySignature(params)) {
            log.warn("VNPAY return: invalid signature, params={}", params);
            return "INVALID_SIGNATURE";
        }

        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef");
        String transactionNo = params.get("vnp_TransactionNo");

        Payment payment = findPaymentByTxnRef(txnRef);
        if (payment == null) return "PAYMENT_NOT_FOUND";

        if ("00".equals(responseCode)) {
            confirmPayment(payment, transactionNo, params);
            return "SUCCESS";
        } else {
            payment.markFailed(toJson(params));
            log.info("VNPAY return: payment {} failed, code={}", payment.getId(), responseCode);
            return "FAILED";
        }
    }

    @Transactional
    public String handleVnpayIpn(Map<String, String> params) {
        if (!vnpayService.verifySignature(params)) {
            return "{\"RspCode\":\"97\",\"Message\":\"Invalid signature\"}";
        }

        String txnRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");
        String transactionNo = params.get("vnp_TransactionNo");

        Payment payment = findPaymentByTxnRef(txnRef);
        if (payment == null) {
            return "{\"RspCode\":\"01\",\"Message\":\"Order not found\"}";
        }

        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return "{\"RspCode\":\"02\",\"Message\":\"Order already confirmed\"}";
        }

        BigDecimal vnpAmount = new BigDecimal(params.get("vnp_Amount")).divide(BigDecimal.valueOf(100));
        if (vnpAmount.compareTo(payment.getAmount()) != 0) {
            return "{\"RspCode\":\"04\",\"Message\":\"Invalid amount\"}";
        }

        if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
            confirmPayment(payment, transactionNo, params);
        } else {
            payment.markFailed(toJson(params));
        }

        return "{\"RspCode\":\"00\",\"Message\":\"Confirm success\"}";
    }

    @Transactional
    public PaymentResponse mockPayment(String email, Long bookingId) {
        Booking booking = findBooking(bookingId);
        validateBookingOwner(booking, email);
        if (booking.getStatus() != BookingStatus.HOLDING) {
            throw new BadRequestException("Only HOLDING bookings can be paid");
        }
        Payment payment = paymentRepository.save(new Payment(booking, PaymentProvider.MOCK, booking.getTotalAmount()));
        confirmPayment(payment, "MOCK-" + System.currentTimeMillis(), Map.of("provider", "MOCK"));
        return toResponse(payment, null);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getByBooking(String email, Long bookingId) {
        Booking booking = findBooking(bookingId);
        validateBookingOwner(booking, email);
        return paymentRepository.findByBooking(booking)
                .stream()
                .findFirst()
                .map(p -> toResponse(p, null))
                .orElseThrow(() -> new NotFoundException("No payment found for this booking"));
    }

    private void confirmPayment(Payment payment, String transactionNo, Map<String, String> params) {
        if (payment.getStatus() == PaymentStatus.SUCCESS) return;

        payment.markSuccess(transactionNo, toJson(params));
        Booking booking = payment.getBooking();
        bookingSeatRepository.findByBooking(booking)
                .forEach(seat -> seat.changeStatus(SeatRuntimeStatus.BOOKED));
        booking.updateAmounts(booking.getSubtotal(), booking.getDiscountAmount(), booking.getTotalAmount());
        booking.markPaid(qrTicketService.generate(booking));
        loyaltyPointService.addPointsFromBooking(booking.getUser(), booking);
        log.info("Payment {} confirmed for booking {}", payment.getId(), booking.getBookingCode());
    }

    private Payment findPaymentByTxnRef(String txnRef) {
        if (txnRef == null) return null;
        String[] parts = txnRef.split("-", 2);
        try {
            Long paymentId = Long.parseLong(parts[0]);
            return paymentRepository.findById(paymentId).orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Booking findBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
    }

    private void validateBookingOwner(Booking booking, String email) {
        if (!booking.getUser().getEmail().equals(email)) {
            throw new NotFoundException("Booking not found");
        }
    }

    private PaymentResponse toResponse(Payment payment, String paymentUrl) {
        return new PaymentResponse(
                payment.getId(),
                payment.getBooking().getId(),
                payment.getProvider(),
                payment.getTransactionId(),
                payment.getAmount(),
                payment.getStatus(),
                paymentUrl,
                payment.getPaidAt(),
                payment.getCreatedAt()
        );
    }

    private String toJson(Map<String, String> params) {
        try {
            return objectMapper.writeValueAsString(params);
        } catch (Exception e) {
            return params.toString();
        }
    }
}
