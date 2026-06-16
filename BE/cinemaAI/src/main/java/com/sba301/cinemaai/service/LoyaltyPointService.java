package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.response.loyalty.LoyaltyResponse;
import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.LoyaltyPoint;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.repository.LoyaltyPointRepository;
import com.sba301.cinemaai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoyaltyPointService {

    private static final int POINTS_PER_UNIT = 10_000;

    private final LoyaltyPointRepository loyaltyPointRepository;
    private final UserRepository userRepository;

    @Transactional
    public LoyaltyResponse getMyPoints(String email) {
        User user = resolveUserByEmail(email);
        LoyaltyPoint lp = getOrCreate(user);
        return LoyaltyResponse.from(lp);
    }

    @Transactional
    public void addPointsFromBooking(User user, Booking booking) {
        int earned = booking.getTotalAmount().intValue() / POINTS_PER_UNIT;
        if (earned <= 0) return;

        LoyaltyPoint lp = getOrCreate(user);
        lp.addPoints(earned);
        loyaltyPointRepository.save(lp);

        log.info("Booking {} — awarded {} loyalty points to user {}",
                booking.getBookingCode(), earned, user.getEmail());
    }

    private LoyaltyPoint getOrCreate(User user) {
        return loyaltyPointRepository.findByUser(user)
                .orElseGet(() -> loyaltyPointRepository.save(new LoyaltyPoint(user)));
    }

    private User resolveUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found: " + email));
    }
}
