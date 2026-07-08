package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.request.refund.ConfirmManualRefundRequest;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.dto.response.PageResponse;
import com.sba301.cinemaai.dto.response.refund.BulkRefundDetailResponse;
import com.sba301.cinemaai.service.StaffBulkRefundService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/bulk-refunds")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin - Bulk Refunds", description = "Admin endpoints for system-triggered bulk refund follow-up")
public class AdminBulkRefundController {

    private final StaffBulkRefundService staffBulkRefundService;

    @GetMapping("/failed")
    @Operation(summary = "List failed bulk refunds")
    public ApiResponse<PageResponse<BulkRefundDetailResponse>> getFailedRefunds(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(staffBulkRefundService.getFailedRefundsList(page, size));
    }

    @GetMapping("/{bookingId}/detail")
    @Operation(summary = "Get failed refund detail")
    public ApiResponse<BulkRefundDetailResponse> getRefundDetail(@PathVariable Long bookingId) {
        return ApiResponse.success(staffBulkRefundService.getRefundDetail(bookingId));
    }

    @PostMapping("/{bookingId}/confirm")
    @Operation(summary = "Confirm manual refund for a failed booking")
    public ApiResponse<BulkRefundDetailResponse> confirmManualRefund(
            @PathVariable Long bookingId,
            @Valid @RequestBody ConfirmManualRefundRequest request
    ) {
        return ApiResponse.success(
                staffBulkRefundService.confirmManualRefund(bookingId, request),
                "Manual refund confirmed"
        );
    }
}
