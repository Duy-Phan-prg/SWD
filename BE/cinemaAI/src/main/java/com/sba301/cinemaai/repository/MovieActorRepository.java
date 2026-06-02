package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.Actor;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.MovieActor;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovieActorRepository extends JpaRepository<MovieActor, Long> {

    List<MovieActor> findByMovie(Movie movie);

    List<MovieActor> findByActor(Actor actor);

    long countByActor(Actor actor);

    boolean existsByMovieAndActor(Movie movie, Actor actor);

    void deleteByMovie(Movie movie);
}
