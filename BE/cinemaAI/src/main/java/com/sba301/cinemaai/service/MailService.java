package com.sba301.cinemaai.service;

import java.math.BigDecimal;

public interface MailService {

    void sendOtp(String to, String otp, String purpose);

    void sendRefundFailedNotice(String to, String bookingCode, BigDecimal amount, String reason);
}
