package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.Showtime;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.enums.BookingStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    boolean existsByBookingCode(String bookingCode);

    Optional<Booking> findByBookingCode(String bookingCode);

    List<Booking> findByUser(User user);

    List<Booking> findByShowtime(Showtime showtime);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByStatusAndHoldExpiresAtBefore(BookingStatus status, LocalDateTime expiresAt);
}
