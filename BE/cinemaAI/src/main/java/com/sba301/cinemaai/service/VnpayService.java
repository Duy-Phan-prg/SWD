package com.sba301.cinemaai.service;

import com.sba301.cinemaai.config.VNPayConfig;
import com.sba301.cinemaai.util.VNPayUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class VNPayService {

    private final VNPayConfig vnPayConfig;

    public String buildPaymentUrl(String txnRef, BigDecimal amount, String orderInfo, String clientIp) {
        Map<String, String> vnpParams = new TreeMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        vnpParams.put("vnp_Amount", String.valueOf(amount.multiply(BigDecimal.valueOf(100)).longValue()));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", orderInfo);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        vnpParams.put("vnp_IpAddr", resolveIp(clientIp));

        String now = new SimpleDateFormat("yyyyMMddHHmmss")
                .format(Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7")).getTime());
        vnpParams.put("vnp_CreateDate", now);

        String secureHash = VNPayUtil.hashAllFields(vnpParams, vnPayConfig.getHashSecret());
        String queryString = buildEncodedQueryString(vnpParams);

        log.info("VNPay payment created for txnRef={}", txnRef);
        return vnPayConfig.getPaymentUrl() + "?" + queryString + "&vnp_SecureHash=" + secureHash;
    }

    public boolean verifySignature(Map<String, String> params) {
        String received = params.get("vnp_SecureHash");
        if (received == null) return false;

        Map<String, String> filtered = new TreeMap<>(params);
        filtered.remove("vnp_SecureHash");
        filtered.remove("vnp_SecureHashType");

        String expected = VNPayUtil.hashAllFields(filtered, vnPayConfig.getHashSecret());
        boolean valid = expected.equalsIgnoreCase(received);
        if (!valid) log.warn("VNPay signature verification failed");
        return valid;
    }

    private String buildEncodedQueryString(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        params.forEach((key, value) -> {
            if (value != null && !value.isEmpty()) {
                if (sb.length() > 0) sb.append("&");
                sb.append(key).append("=").append(URLEncoder.encode(value, StandardCharsets.UTF_8));
            }
        });
        return sb.toString();
    }

    private String resolveIp(String clientIp) {
        return (clientIp == null || clientIp.contains(":")) ? "127.0.0.1" : clientIp;
    }
}
