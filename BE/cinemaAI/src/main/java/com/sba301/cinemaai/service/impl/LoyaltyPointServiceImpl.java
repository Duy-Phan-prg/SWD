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
import java.math.BigDecimal;
import java.math.RoundingMode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoyaltyPointServiceImpl implements LoyaltyPointService {

    private static final BigDecimal EARN_RATE = BigDecimal.valueOf(0.01);

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
    public LoyaltyResponse redeemMyPoints(String email, int points) {
        return redeemPoints(resolveUserByEmail(email).getId(), points);
    }

    @Transactional
    public void addPointsFromBooking(User user, Booking booking) {
        int earned = calculateEarnedPoints(booking);
        if (earned <= 0) return;

        LoyaltyPoint lp = getOrCreate(user);
        addPoints(lp, earned);
        loyaltyPointRepository.save(lp);

        log.info("Booking {} — awarded {} loyalty points to user {}",
                booking.getBookingCode(), earned, user.getEmail());
    }

    @Transactional
    public void revokePointsFromBooking(User user, Booking booking) {
        int earned = calculateEarnedPoints(booking);
        if (earned <= 0) return;

        LoyaltyPoint lp = loyaltyPointRepository.findByUser(user).orElse(null);
        if (lp == null) return;

        int toRevoke = Math.min(earned, lp.getPoints());
        if (toRevoke > 0) {
            lp.setPoints(lp.getPoints() - toRevoke);
            loyaltyPointRepository.save(lp);
            log.info("Booking {} — revoked {} loyalty points from user {}",
                    booking.getBookingCode(), toRevoke, user.getEmail());
        }
    }

    @Transactional
    public int redeemPointsForBooking(User user, Booking booking, int points) {
        if (points <= 0) {
            return 0;
        }
        LoyaltyPoint lp = getOrCreate(user);
        if (lp.getPoints() < points) {
            throw new BadRequestException(
                    "Insufficient points. Available: " + lp.getPoints() + ", requested: " + points);
        }
        redeemPoints(lp, points);
        loyaltyPointRepository.save(lp);
        log.info("Booking {} — redeemed {} loyalty points from user {}",
                booking.getBookingCode(), points, user.getEmail());
        return points;
    }

    @Transactional
    public void restoreRedeemedPointsFromBooking(User user, Booking booking) {
        int redeemed = booking.getDiscountAmount() == null ? 0 : booking.getDiscountAmount().intValue();
        if (redeemed <= 0) return;

        LoyaltyPoint lp = getOrCreate(user);
        restorePoints(lp, redeemed);
        loyaltyPointRepository.save(lp);
        log.info("Booking {} — restored {} redeemed loyalty points to user {}",
                booking.getBookingCode(), redeemed, user.getEmail());
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

    private void restorePoints(LoyaltyPoint loyaltyPoint, int points) {
        loyaltyPoint.setPoints(loyaltyPoint.getPoints() + points);
    }

    private int calculateEarnedPoints(Booking booking) {
        if (booking.getTotalAmount() == null || booking.getTotalAmount().signum() <= 0) {
            return 0;
        }
        return booking.getTotalAmount()
                .multiply(EARN_RATE)
                .setScale(0, RoundingMode.DOWN)
                .intValue();
    }
}
