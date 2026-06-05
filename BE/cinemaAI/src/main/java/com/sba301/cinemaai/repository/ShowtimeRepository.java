package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.Room;
import com.sba301.cinemaai.entity.Showtime;
import com.sba301.cinemaai.enums.ShowtimeStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShowtimeRepository extends JpaRepository<Showtime, Long> {

    List<Showtime> findByMovie(Movie movie);

    List<Showtime> findByRoom(Room room);

    List<Showtime> findByStatus(ShowtimeStatus status);

    List<Showtime> findByStartTimeBetween(LocalDateTime from, LocalDateTime to);
    Optional<Showtime> findByRoomAndMovieAndStartTime(Room room, Movie movie, LocalDateTime startTime);

    boolean existsByRoomAndMovieAndStartTime(Room room, Movie movie, LocalDateTime startTime);

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
