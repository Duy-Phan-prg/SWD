package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.Showtime;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.enums.BookingStatus;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    boolean existsByBookingCode(String bookingCode);

    Optional<Booking> findByBookingCode(String bookingCode);

    List<Booking> findByUser(User user);

    Page<Booking> findByUser(User user, Pageable pageable);

    List<Booking> findByShowtime(Showtime showtime);

    boolean existsByShowtimeAndStatusIn(Showtime showtime, Collection<BookingStatus> statuses);

    List<Booking> findByStatus(BookingStatus status);

    Page<Booking> findByStatus(BookingStatus status, Pageable pageable);

    List<Booking> findByStatusAndHoldExpiresAtBefore(BookingStatus status, LocalDateTime expiresAt);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM Booking b WHERE b.user = :user AND b.showtime.movie = :movie AND b.status = 'USED'")
    boolean existsUsedBookingByUserAndMovie(@Param("user") User user, @Param("movie") Movie movie);

    @Query("SELECT b FROM Booking b WHERE b.showtime = :showtime AND b.status = :status")
    List<Booking> findByShowtimeAndStatus(@Param("showtime") Showtime showtime, @Param("status") BookingStatus status);
}
