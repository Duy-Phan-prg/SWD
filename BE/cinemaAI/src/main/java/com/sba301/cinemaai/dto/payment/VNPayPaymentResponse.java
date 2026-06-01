package com.sba301.cinemaai.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VNPayPaymentResponse {
    private String code;
    private String message;
    private String paymentUrl;
}
