package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.refund.ConfirmManualRefundRequest;
import com.sba301.cinemaai.dto.response.PageResponse;
import com.sba301.cinemaai.dto.response.refund.BulkRefundDetailResponse;

public interface StaffBulkRefundService {

    PageResponse<BulkRefundDetailResponse> getFailedRefundsList(int page, int size);

    BulkRefundDetailResponse getRefundDetail(Long bookingId);

    BulkRefundDetailResponse confirmManualRefund(Long bookingId, ConfirmManualRefundRequest request);
}
