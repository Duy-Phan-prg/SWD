package com.sba301.cinemaai.service;

import java.math.BigDecimal;
import java.util.Map;

public interface VNPayService {

        public String buildPaymentUrl(String txnRef, BigDecimal amount, String orderInfo, String clientIp);

        public boolean verifySignature(Map<String, String> params);
}
