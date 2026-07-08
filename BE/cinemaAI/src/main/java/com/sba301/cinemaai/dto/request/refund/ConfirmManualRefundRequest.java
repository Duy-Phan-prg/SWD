package com.sba301.cinemaai.dto.request.refund;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ConfirmManualRefundRequest(
        @NotBlank(message = "Refund method is required")
        @Pattern(regexp = "MANUAL_BANK_TRANSFER|BANK_TRANSFER|CASH", message = "Refund method must be BANK_TRANSFER or CASH")
        String refundMethod,

        @Size(max = 500, message = "Notes must be at most 500 characters")
        String notes
) {
}
