package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.booking.FoodOrderRequest;
import com.sba301.cinemaai.dto.response.booking.FoodOrderResponse;
import java.util.List;

public interface FoodOrderService {

    FoodOrderResponse create(String email, Long bookingId, FoodOrderRequest request);

    List<FoodOrderResponse> listByBooking(String email, Long bookingId);

    FoodOrderResponse createStaffOrder(String bookingOrTicketCode, FoodOrderRequest request);
}
