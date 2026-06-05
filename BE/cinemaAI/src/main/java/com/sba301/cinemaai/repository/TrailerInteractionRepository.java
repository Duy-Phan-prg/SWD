package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.TrailerInteraction;
import com.sba301.cinemaai.entity.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrailerInteractionRepository extends JpaRepository<TrailerInteraction, Long> {

    List<TrailerInteraction> findByUser(User user);

    List<TrailerInteraction> findByMovie(Movie movie);
}
