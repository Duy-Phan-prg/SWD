package com.sba301.cinemaai.ai.service.impl;

import com.sba301.cinemaai.ai.client.AIRecommendationClient;
import com.sba301.cinemaai.ai.dto.request.CollaborativeRecommendRequest;
import com.sba301.cinemaai.ai.dto.request.ContentRecommendRequest;
import com.sba301.cinemaai.ai.dto.response.RecommendMovieResponse;
import com.sba301.cinemaai.ai.service.RecommendationService;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.repository.MovieActorRepository;
import com.sba301.cinemaai.repository.MovieGenreRepository;
import com.sba301.cinemaai.repository.MovieRepository;
import com.sba301.cinemaai.repository.RatingRepository;
import com.sba301.cinemaai.repository.WatchHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final MovieRepository movieRepository;
    private final MovieActorRepository movieActorRepository;
    private final MovieGenreRepository movieGenreRepository;
    private final WatchHistoryRepository watchRepository;
    private final RatingRepository ratingRepository;
    private final AIRecommendationClient client;

    @Override
    public List<RecommendMovieResponse> content(Long movieId) {

        Movie movie = movieRepository.findById(movieId).orElseThrow();

        ContentRecommendRequest req = new ContentRecommendRequest();

        req.setMovieId(movie.getId());

        req.setDescription(safe(movie.getDescription()));

        req.setDirector(safe(movie.getDirector()));

        req.setActors(
                movieActorRepository.findByMovieId(movieId)
                        .stream()
                        .map(x -> x.getActor().getName())
                        .collect(Collectors.joining(" "))
        );

        req.setGenres(
                movieGenreRepository.findByMovieId(movieId)
                        .stream()
                        .map(x -> x.getGenre().getName())
                        .toList()
        );

        return client.content(req);
    }

    @Override
    public List<RecommendMovieResponse> collaborative(Long userId) {

        List<Long> watched = watchRepository.findByUserId(userId)
                .stream()
                .map(x -> x.getMovie().getId())
                .toList();

        List<Long> rated = ratingRepository.findByUserId(userId)
                .stream()
                .map(x -> x.getMovie().getId())
                .toList();

        CollaborativeRecommendRequest req = new CollaborativeRecommendRequest();
        req.setUserId(userId);
        req.setWatchedMovies(watched);
        req.setRatedMovies(rated);

        return client.collaborative(req);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

}
