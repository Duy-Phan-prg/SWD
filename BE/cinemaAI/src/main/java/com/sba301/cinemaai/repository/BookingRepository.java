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

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
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

    @Query("SELECT b FROM Booking b WHERE b.user = :user AND b.showtime.movie = :movie AND b.status = 'USED' ORDER BY b.checkedInAt DESC, b.id DESC")
    List<Booking> findUsedBookingsByUserAndMovieOrderByLatest(@Param("user") User user, @Param("movie") Movie movie);

    @Query("SELECT b FROM Booking b WHERE b.showtime = :showtime AND b.status = :status")
    List<Booking> findByShowtimeAndStatus(@Param("showtime") Showtime showtime, @Param("status") BookingStatus status);

    @Query("SELECT COUNT(bs) FROM BookingSeat bs JOIN bs.booking b WHERE b.status IN ('PAID','USED') AND b.paidAt BETWEEN :from AND :to")
    long countTicketsSold(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            SELECT b.showtime.movie.id, b.showtime.movie.title, COUNT(bs), SUM(b.totalAmount)
            FROM BookingSeat bs JOIN bs.booking b
            WHERE b.status IN ('PAID','USED') AND b.paidAt BETWEEN :from AND :to
            GROUP BY b.showtime.movie.id, b.showtime.movie.title
            ORDER BY COUNT(bs) DESC
            """)
    List<Object[]> topMoviesByTickets(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            SELECT s.room.id, s.room.name, COUNT(bs), (s.room.rowCount * s.room.columnCount)
            FROM BookingSeat bs JOIN bs.booking b JOIN b.showtime s
            WHERE b.status IN ('PAID','USED') AND b.paidAt BETWEEN :from AND :to
            GROUP BY s.room.id, s.room.name, s.room.rowCount, s.room.columnCount
            """)
    List<Object[]> occupancyByRoom(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);


    @Lock(LockModeType.PESSIMISTIC_WRITE) // Sinh lệnh khóa dòng dữ liệu trong SQL Server
    @Query("SELECT b FROM Booking b WHERE b.showtime.id = :showtimeId AND b.status = :status")
    List<Booking> findByShowtimeIdAndStatusForUpdate(
            @Param("showtimeId") Long showtimeId,
            @Param("status") BookingStatus status
    );

    // 2. Hàm tìm và KHÓA ĐƠN LẺ (Dùng cho Staff khi bấm duyệt xử lý lỗi thủ công offline)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") Long id);
}
