package com.sba301.cinemaai.service;

import com.sba301.cinemaai.entity.Showtime;

public interface RefundService {

    void processShowtimeCancellation(Showtime showtime, String reason);

    void confirmManualRefund(Long bookingId, String staffName, String notes);
}
