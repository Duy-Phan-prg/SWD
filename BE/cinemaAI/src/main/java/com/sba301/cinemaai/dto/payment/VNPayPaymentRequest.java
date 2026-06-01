package com.sba301.cinemaai.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VNPayPaymentRequest {
    private Long bookingId;
    private Long amount; // VND
    private String orderInfo;
    private String orderType;
    private String locale; // vn or en
    private String bankCode; // Optional: NCB, VNPAYQR, VNBANK, IB, ATM, VISA, etc.
}
