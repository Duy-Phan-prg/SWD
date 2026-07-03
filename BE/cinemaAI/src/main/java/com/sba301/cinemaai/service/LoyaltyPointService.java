package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.loyalty.LoyaltyAddRequest;
import com.sba301.cinemaai.dto.response.loyalty.LoyaltyResponse;
import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.User;

public interface LoyaltyPointService {

        LoyaltyResponse getMyPoints(String email);

        LoyaltyResponse addPoints(LoyaltyAddRequest request);

        LoyaltyResponse redeemPoints(Long userId, int points);

        /** Redeem points by authenticated customer (1000 points = 1000 VND discount). */
        LoyaltyResponse redeemMyPoints(String email, int points);

        void addPointsFromBooking(User user, Booking booking);

        int redeemPointsForBooking(User user, Booking booking, int points);

        void restoreRedeemedPointsFromBooking(User user, Booking booking);

        /** Revoke points that were previously earned from a booking (e.g. when showtime is cancelled). */
        void revokePointsFromBooking(User user, Booking booking);
}
