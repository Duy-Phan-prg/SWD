package com.sba301.cinemaai.service.impl;

import com.sba301.cinemaai.dto.response.refund.VnpRefundResponse;
import com.sba301.cinemaai.entity.Payment;
import com.sba301.cinemaai.service.VNPayService;
import com.sba301.cinemaai.config.VNPayConfig;
import com.sba301.cinemaai.util.VNPayUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class VNPayServiceImpl implements VNPayService {

    @Value("${vnpay.api-query-url}")
    private String vnpRefundApiUrl;

    @Value("${vnpay.tmn-code}")
    private String vnpTmnCode;

    @Value("${vnpay.hash-secret}")
    private String vnpHashSecret;

    private final VNPayConfig vnPayConfig;

    // BỔ SUNG: Khởi tạo các công cụ xử lý JSON và HTTP Client nội bộ để tránh báo lỗi "Cannot resolve symbol"
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String buildPaymentUrl(String txnRef, BigDecimal amount, String orderInfo, String clientIp) {
        Map<String, String> vnpParams = new TreeMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        vnpParams.put("vnp_Amount", amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .toPlainString());
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", orderInfo);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        vnpParams.put("vnp_IpAddr", resolveIp(clientIp));

        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        vnpParams.put("vnp_CreateDate", formatter.format(calendar.getTime()));
        calendar.add(Calendar.MINUTE, 15);
        vnpParams.put("vnp_ExpireDate", formatter.format(calendar.getTime()));

        String secureHash = VNPayUtil.hashAllFields(vnpParams, vnPayConfig.getHashSecret());
        String queryString = buildEncodedQueryString(vnpParams);

        log.info("VNPay payment created for txnRef={} amount={}", txnRef, amount);
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
        if (clientIp == null || clientIp.isBlank() || clientIp.contains(":")) {
            String defaultClientIp = vnPayConfig.getDefaultClientIp();
            return (defaultClientIp == null || defaultClientIp.isBlank()) ? "127.0.0.1" : defaultClientIp;
        }
        return clientIp;
    }

    @Override
    public VnpRefundResponse requestRefund(Payment payment, BigDecimal amount) {
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
            String vnp_TxnRef = payment.getBooking().getId().toString();
            String vnp_CreateDate = LocalDateTime.now().format(formatter);

            // Số tiền hoàn (Chuỗi phục vụ cho việc tạo chuỗi Hash)
            String vnp_AmountStr = amount.multiply(BigDecimal.valueOf(100)).setScale(0, RoundingMode.HALF_UP).toPlainString();
            // Số tiền hoàn (Kiểu Long phục vụ cho payload JSON)
            Long vnp_AmountLong = Long.parseLong(vnp_AmountStr);

            // Khởi tạo các giá trị cố định trước
            String requestId = String.valueOf(System.currentTimeMillis());
            String transactionDate = payment.getPaidAt().format(formatter); // Kiểm tra xem có đúng định dạng yyyyMMddHHmmss không (VD: 20260704212328)
            String orderInfo = "Hoan tien tu dong su co suat chieu cho Booking ID: " + vnp_TxnRef;

// 1. Tạo chuỗi Hash (CÁC TRƯỜNG PHẢI PHÂN CÁCH BẰNG DẤU GẠCH ĐỨNG | )
            String rawHashData = String.join("|",
                    requestId,                  // vnp_RequestId
                    "2.1.0",                    // vnp_Version
                    "refund",                   // vnp_Command
                    vnpTmnCode,                 // vnp_TmnCode
                    "02",                       // vnp_TransactionType
                    vnp_TxnRef,                 // vnp_TxnRef
                    vnp_AmountStr,              // vnp_Amount (Dạng chuỗi, ví dụ: "5000000")
                    payment.getTransactionId(), // vnp_TransactionNo
                    transactionDate,            // vnp_TransactionDate
                    "System_Admin_Bulk_Refund", // vnp_CreateBy
                    vnp_CreateDate,             // vnp_CreateDate
                    "127.0.0.1",                // vnp_IpAddr
                    orderInfo                   // vnp_OrderInfo
            );

            String vnp_SecureHash = hmacSHA512(vnpHashSecret, rawHashData);
            // 1. Chuẩn bị chuỗi dữ liệu băm (Raw Hash Data) theo đúng thứ tự tài liệu VNPay quy định



            // 2. Gom các tham số vào Map<String, Object> để đảm bảo đúng kiểu dữ liệu JSON
            Map<String, Object> jsonParams = new HashMap<>();
            // Lấy vnp_RequestId giống hệt chuỗi đã dùng để băm phía trên

            jsonParams.put("vnp_RequestId", requestId);
            jsonParams.put("vnp_Version", "2.1.0");
            jsonParams.put("vnp_Command", "refund");
            jsonParams.put("vnp_TmnCode", vnpTmnCode);
            jsonParams.put("vnp_TransactionType", "02");
            jsonParams.put("vnp_TxnRef", vnp_TxnRef);
            jsonParams.put("vnp_Amount", vnp_AmountLong); // ÉP KIỂU SỐ (NUMBER) Ở ĐÂY
            jsonParams.put("vnp_OrderInfo", "Hoan tien tu dong su co suat chieu cho Booking ID: " + vnp_TxnRef);
            jsonParams.put("vnp_TransactionNo", payment.getTransactionId());
            jsonParams.put("vnp_TransactionDate", payment.getPaidAt().format(formatter));
            jsonParams.put("vnp_CreateBy", "System_Admin_Bulk_Refund");
            jsonParams.put("vnp_CreateDate", vnp_CreateDate);
            jsonParams.put("vnp_IpAddr", "127.0.0.1");
            jsonParams.put("vnp_SecureHash", vnp_SecureHash);

            // 3. Chuyển thành JSON Payload
            String jsonRequestBody = objectMapper.writeValueAsString(jsonParams);

            // 4. Gửi HTTP Request tới VNPay
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(vnpRefundApiUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonRequestBody))
                    .build();

            log.info("Sending refund request to VNPay for Booking Code: {} with payload: {}", vnp_TxnRef, jsonRequestBody);

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            log.info("Received response from VNPay for Booking Code {}: {}", vnp_TxnRef, response.body());

            Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
            String responseCode = (String) responseMap.get("vnp_ResponseCode");
            String refundTxnNo = (String) responseMap.get("vnp_RefundTransactionNo");
            String message = (String) responseMap.get("vnp_Message");

            return new VnpRefundResponse(responseCode, refundTxnNo, message);

        } catch (Exception e) {
            log.error("Critical error while contacting VNPay Refund API for Payment ID: {}", payment.getId(), e);
            return new VnpRefundResponse("99", null, "Connection timeout or parse mapping error");
        }
    }

    private String hmacSHA512(String key, String data) {
        try {
            javax.crypto.Mac sha512_HMAC = javax.crypto.Mac.getInstance("HmacSHA512");
            javax.crypto.spec.SecretKeySpec secret_key = new javax.crypto.spec.SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            sha512_HMAC.init(secret_key);
            byte[] hash = sha512_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to calculate HMAC-SHA512 hash", e);
        }
    }
}
