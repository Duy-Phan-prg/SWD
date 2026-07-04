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

    @Value("${https://sandbox.vnpayment.vn/merchant_webapi/api/transaction}")
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
        if (clientIp == null || clientIp.isBlank() || clientIp.contains(":")) {
            String defaultClientIp = vnPayConfig.getDefaultClientIp();
            return (defaultClientIp == null || defaultClientIp.isBlank()) ? "127.0.0.1" : defaultClientIp;
        }
        return clientIp;
    }

    @Override
    public VnpRefundResponse requestRefund(Payment payment, BigDecimal amount) {
        try {
            // 1. Chuẩn bị định dạng thời gian theo chuẩn VNPay (yyyyMMddHHmmss)
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
            String vnp_TxnRef = payment.getBooking().getId().toString(); // Dùng chính BookingId làm mã đối soát gốc
            String vnp_CreateDate = LocalDateTime.now().format(formatter);

            // Số tiền hoàn cần nhân 100 và chuyển thành chuỗi không chứa dấu chấm thập phân
            String vnp_Amount = amount.multiply(BigDecimal.valueOf(100)).setScale(0).toString();

            // 2. Gom các tham số nghiệp vụ bắt buộc của VNPay Refund API
            Map<String, String> params = new HashMap<>();
            params.put("vnp_RequestId", String.valueOf(System.currentTimeMillis()));
            params.put("vnp_Version", "2.1.0");
            params.put("vnp_Command", "refund");
            params.put("vnp_TmnCode", vnpTmnCode);
            params.put("vnp_TransactionType", "02"); // 02: Hoàn trả toàn bộ (Full Refund)
            params.put("vnp_TxnRef", vnp_TxnRef);
            params.put("vnp_Amount", vnp_Amount);
            params.put("vnp_OrderInfo", "Hoan tien tu dong su co suat chieu cho Booking ID: " + vnp_TxnRef);
            params.put("vnp_TransactionNo", payment.getTransactionId()); // Mã giao dịch gốc thu được từ VNPay lúc khách mua vé
            params.put("vnp_TransactionDate", payment.getPaidAt().format(formatter)); // Thời điểm khách thanh toán đơn gốc
            params.put("vnp_CreateBy", "System_Admin_Bulk_Refund");
            params.put("vnp_CreateDate", vnp_CreateDate);
            params.put("vnp_IpAddr", "127.0.0.1");

            // 3. Tiến hành tạo chuỗi mã hóa bảo mật Checksum (vnp_SecureHash)
            String rawHashData = String.join("|",
                    params.get("vnp_RequestId"),
                    params.get("vnp_Version"),
                    params.get("vnp_Command"),
                    params.get("vnp_TmnCode"),
                    params.get("vnp_TransactionType"),
                    params.get("vnp_TxnRef"),
                    params.get("vnp_Amount"),
                    params.get("vnp_TransactionNo"),
                    params.get("vnp_TransactionDate"),
                    params.get("vnp_CreateBy"),
                    params.get("vnp_CreateDate"),
                    params.get("vnp_IpAddr"),
                    params.get("vnp_OrderInfo")
            );

            // Gọi hàm băm dữ liệu HMAC-SHA512 bằng SecretKey của rạp
            String vnp_SecureHash = hmacSHA512(vnpHashSecret, rawHashData);
            params.put("vnp_SecureHash", vnp_SecureHash);

            // 4. Chuyển Map dữ liệu thành chuỗi JSON Payload
            String jsonRequestBody = objectMapper.writeValueAsString(params);

            // 5. Khởi tạo đối tượng HttpRequest bắn sang cổng VNPay Sandbox
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(vnpRefundApiUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonRequestBody))
                    .build();

            log.info("Sending refund request to VNPay for Booking Code: {} with payload: {}", vnp_TxnRef, jsonRequestBody);

            // Thực thi gửi request đồng bộ và chờ kết quả phản hồi
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            log.info("Received response from VNPay for Booking Code {}: {}", vnp_TxnRef, response.body());

            // 6. Đọc dữ liệu JSON trả về từ VNPay và bóc tách map vào DTO
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