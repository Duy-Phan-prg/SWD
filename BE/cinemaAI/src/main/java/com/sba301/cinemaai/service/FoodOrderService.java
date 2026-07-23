package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.booking.FoodOrderRequest;
import com.sba301.cinemaai.dto.response.booking.FoodOrderResponse;
import java.util.List;

public interface FoodOrderService {

    /**
     * Khách hàng đặt thêm bắp nước online cho booking của mình.
     * Booking phải ở trạng thái PAID hoặc USED và suất chiếu chưa kết thúc.
     */
    FoodOrderResponse create(String email, Long bookingId, FoodOrderRequest request);

    /** Trả về tất cả đơn bắp nước của một booking — chỉ chủ booking mới được xem. */
    List<FoodOrderResponse> listByBooking(String email, Long bookingId);

    /**
     * Staff quầy thu ngân tạo đơn và thu tiền mặt ngay tại quầy.
     * {@code bookingOrTicketCode} có thể là booking code, ticket code, hoặc chuỗi QR ({@code CINEAI:…}).
     * Payment được ghi với provider CASH để tách doanh thu quầy khỏi giao dịch online trong báo cáo.
     */
    FoodOrderResponse createStaffOrder(String bookingOrTicketCode, FoodOrderRequest request);
}
