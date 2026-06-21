package com.sba301.cinemaai.service.impl;


import com.sba301.cinemaai.service.LoyaltyPointService;
import com.sba301.cinemaai.dto.request.loyalty.LoyaltyAddRequest;
import com.sba301.cinemaai.dto.response.loyalty.LoyaltyResponse;
import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.LoyaltyPoint;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.exception.BadRequestException;
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
public class LoyaltyPointServiceImpl implements LoyaltyPointService {

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
    public LoyaltyResponse addPoints(LoyaltyAddRequest request) {
        User user = resolveUserById(request.getUserId());
        LoyaltyPoint lp = getOrCreate(user);

        addPoints(lp, request.getPoints());
        loyaltyPointRepository.save(lp);

        log.info("Added {} points to user {} — reason: {}",
                request.getPoints(), user.getEmail(),
                request.getReason() != null ? request.getReason() : "n/a");

        return LoyaltyResponse.from(lp);
    }

    @Transactional
    public LoyaltyResponse redeemPoints(Long userId, int points) {
        if (points <= 0) {
            throw new BadRequestException("Points to redeem must be positive");
        }
        User user = resolveUserById(userId);
        LoyaltyPoint lp = getOrCreate(user);

        if (lp.getPoints() < points) {
            throw new BadRequestException(
                    "Insufficient points. Available: " + lp.getPoints() + ", requested: " + points);
        }

        redeemPoints(lp, points);
        loyaltyPointRepository.save(lp);

        log.info("Redeemed {} points from user {}", points, user.getEmail());
        return LoyaltyResponse.from(lp);
    }

    @Transactional
    public void addPointsFromBooking(User user, Booking booking) {
        int earned = booking.getTotalAmount().intValue() / POINTS_PER_UNIT;
        if (earned <= 0) return;

        LoyaltyPoint lp = getOrCreate(user);
        addPoints(lp, earned);
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

    private User resolveUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));
    }

    private void addPoints(LoyaltyPoint loyaltyPoint, int points) {
        loyaltyPoint.setPoints(loyaltyPoint.getPoints() + points);
        loyaltyPoint.setTotalPoints(loyaltyPoint.getTotalPoints() + points);
    }

    private void redeemPoints(LoyaltyPoint loyaltyPoint, int points) {
        loyaltyPoint.setPoints(loyaltyPoint.getPoints() - points);
    }
}
