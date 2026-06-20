package com.sba301.cinemaai.service;

import com.sba301.cinemaai.entity.Booking;
import org.springframework.stereotype.Service;

public interface QrTicketService {

        public String generate(Booking booking);

        public String extractBookingCode(String qrCode);
}