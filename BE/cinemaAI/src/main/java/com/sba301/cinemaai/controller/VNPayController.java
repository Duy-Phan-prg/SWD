package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.payment.PaymentResponse;
import com.sba301.cinemaai.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/payment/vnpay")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "VNPay Payment", description = "VNPay payment gateway integration")
public class VNPayController {
    
    private final PaymentService paymentService;
    
    @PostMapping("/create/{bookingId}")
    @Operation(summary = "Create VNPay payment", description = "Generate VNPay payment URL for booking")
    public ResponseEntity<PaymentResponse> createPayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId,
            HttpServletRequest request) {
        
        String clientIp = getClientIp(request);
        log.info("Creating VNPay payment for booking: {}, IP: {}", bookingId, clientIp);
        
        PaymentResponse response = paymentService.createVnpayPayment(
            userDetails.getUsername(), 
            bookingId, 
            clientIp
        );
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/ipn")
    @Operation(summary = "VNPay IPN callback", description = "Handle VNPay Instant Payment Notification")
    public ResponseEntity<String> handleIpn(@RequestParam Map<String, String> params) {
        log.info("Received VNPay IPN");
        String result = paymentService.handleVnpayIpn(params);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/return")
    @Operation(summary = "VNPay return URL", description = "Handle VNPay payment return")
    public ResponseEntity<Map<String, Object>> handleReturn(@RequestParam Map<String, String> params) {
        log.info("Received VNPay return");
        String status = paymentService.handleVnpayReturn(params);
        
        return ResponseEntity.ok(Map.of(
            "status", status,
            "message", getStatusMessage(status)
        ));
    }
    
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip != null ? ip.split(",")[0].trim() : "127.0.0.1";
    }
    
    private String getStatusMessage(String status) {
        return switch (status) {
            case "SUCCESS" -> "Payment successful";
            case "FAILED" -> "Payment failed";
            case "INVALID_SIGNATURE" -> "Invalid payment signature";
            case "PAYMENT_NOT_FOUND" -> "Payment not found";
            default -> "Unknown status";
        };
    }
}
