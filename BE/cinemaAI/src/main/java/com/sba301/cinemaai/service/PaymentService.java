package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.response.payment.PaymentResponse;
import java.util.Map;

public interface PaymentService {

        public PaymentResponse createVnpayPayment(String email, Long bookingId, String clientIp);

        public String handleVnpayReturn(Map<String, String> params);

        public String handleVnpayIpn(Map<String, String> params);

        public PaymentResponse mockPayment(String email, Long bookingId);

        public PaymentResponse getByBooking(String email, Long bookingId);
}
