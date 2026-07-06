package com.sba301.cinemaai.dto.response.refund;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VnpRefundResponse {
    private String responseCode;
    private String refundTransactionNo;
    private String message;
}