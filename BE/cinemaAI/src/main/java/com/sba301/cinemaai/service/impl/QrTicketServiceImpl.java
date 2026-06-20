package com.sba301.cinemaai.service.impl;

import com.sba301.cinemaai.entity.Booking;
import org.springframework.stereotype.Service;
import com.sba301.cinemaai.service.QrTicketService;

@Service
public class QrTicketServiceImpl implements QrTicketService {

    private static final String PREFIX = "CINEAI:";

    public String generate(Booking booking) {
        return PREFIX + booking.getBookingCode() + ":" + booking.getUser().getId();
    }

    public String extractBookingCode(String qrCode) {
        if (qrCode == null || !qrCode.startsWith(PREFIX)) {
            throw new IllegalArgumentException("Invalid QR code");
        }
        String[] parts = qrCode.split(":");
        if (parts.length < 3) {
            throw new IllegalArgumentException("Invalid QR code");
        }
        return parts[1];
    }
}
