package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.BookingPromotion;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingPromotionRepository extends JpaRepository<BookingPromotion, Long> {

    Optional<BookingPromotion> findByBookingId(Long bookingId);

    boolean existsByBookingId(Long bookingId);
}