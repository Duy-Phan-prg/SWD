package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.response.refund.VnpRefundResponse;
import com.sba301.cinemaai.entity.Payment;

import java.math.BigDecimal;
import java.util.Map;

public interface VNPayService {

        public String buildPaymentUrl(String txnRef, BigDecimal amount, String orderInfo, String clientIp);

        public boolean verifySignature(Map<String, String> params);

        VnpRefundResponse requestRefund(Payment payment, java.math.BigDecimal amount);
}
