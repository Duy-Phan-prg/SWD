package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.loyalty.LoyaltyAddRequest;
import com.sba301.cinemaai.dto.response.loyalty.LoyaltyResponse;
import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.User;

public interface LoyaltyPointService {

        public LoyaltyResponse getMyPoints(String email);

        public LoyaltyResponse addPoints(LoyaltyAddRequest request);

        public LoyaltyResponse redeemPoints(Long userId, int points);

        public void addPointsFromBooking(User user, Booking booking);
}
