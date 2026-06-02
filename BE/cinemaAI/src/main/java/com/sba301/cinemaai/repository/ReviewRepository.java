package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.Review;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.enums.ReviewStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByMovieAndStatus(Movie movie, ReviewStatus status);

    List<Review> findByUser(User user);

    Optional<Review> findByUserAndMovie(User user, Movie movie);

    boolean existsByUserAndMovie(User user, Movie movie);
}
