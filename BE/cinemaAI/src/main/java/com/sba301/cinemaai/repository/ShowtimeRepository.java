package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.Room;
import com.sba301.cinemaai.entity.Showtime;
import com.sba301.cinemaai.enums.ShowtimeStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {

    List<Showtime> findByMovie(Movie movie);

    List<Showtime> findByRoom(Room room);

    List<Showtime> findByStatus(ShowtimeStatus status);

    List<Showtime> findByStartTimeBetween(LocalDateTime from, LocalDateTime to);

    Optional<Showtime> findByRoomAndMovieAndStartTime(Room room, Movie movie, LocalDateTime startTime);

    boolean existsByRoomAndMovieAndStartTime(Room room, Movie movie, LocalDateTime startTime);

    /**
     * Admin paged search – every filter is optional.
     * When a parameter is null the corresponding WHERE clause is skipped.
     */
    @Query("""
            select s from Showtime s
            where (:movieId   is null or s.movie.id             = :movieId)
              and (:roomId    is null or s.room.id              = :roomId)
              and (:cinemaId  is null or s.room.cinema.id       = :cinemaId)
              and (:status    is null or s.status               = :status)
              and s.startTime >= :from
              and s.startTime <  :to
            """)
    Page<Showtime> searchAdmin(
            @Param("movieId")  Long movieId,
            @Param("roomId")   Long roomId,
            @Param("cinemaId") Long cinemaId,
            @Param("status")   ShowtimeStatus status,
            @Param("from")     LocalDateTime from,
            @Param("to")       LocalDateTime to,
            Pageable pageable
    );

    @Query("""
            select count(showtime) > 0
            from Showtime showtime
            where showtime.room = :room
              and showtime.status <> com.sba301.cinemaai.enums.ShowtimeStatus.CANCELLED
              and (:excludeId is null or showtime.id <> :excludeId)
              and showtime.startTime < :endTime
              and showtime.endTime > :startTime
            """)
    boolean existsOverlapping(
            @Param("room") Room room,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeId") Long excludeId
    );
}
