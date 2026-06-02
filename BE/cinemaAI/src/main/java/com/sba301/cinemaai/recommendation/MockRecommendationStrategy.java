package com.sba301.cinemaai.recommendation;

import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.MovieActor;
import com.sba301.cinemaai.entity.MovieGenre;
import com.sba301.cinemaai.repository.MovieActorRepository;
import com.sba301.cinemaai.repository.MovieGenreRepository;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class MockRecommendationStrategy implements RecommendationStrategy {

    private final MovieGenreRepository movieGenreRepository;
    private final MovieActorRepository movieActorRepository;

    @Override
    public List<RecommendationCandidate> recommend(RecommendationContext context, List<Movie> candidates) {
        return candidates.stream()
                .filter(movie -> !context.watchedMovieIds().contains(movie.getId()))
                .map(movie -> score(context, movie))
                .filter(candidate -> candidate.getScore() > 0)
                .sorted(Comparator.comparing(RecommendationCandidate::getScore).reversed())
                .toList();
    }

    private RecommendationCandidate score(RecommendationContext context, Movie movie) {
        RecommendationCandidate candidate = new RecommendationCandidate(movie);

        for (MovieGenre movieGenre : movieGenreRepository.findByMovie(movie)) {
            Long genreId = movieGenre.getGenre().getId();
            Double score = context.genreScores().get(genreId);
            if (score != null) {
                candidate.addScore(score, "Matches preferred genre: " + movieGenre.getGenre().getName());
            }
        }

        for (MovieActor movieActor : movieActorRepository.findByMovie(movie)) {
            Long actorId = movieActor.getActor().getId();
            Double score = context.actorScores().get(actorId);
            if (score != null) {
                candidate.addScore(score * 1.2, "Includes favorite actor: " + movieActor.getActor().getName());
            }
        }

        if (StringUtils.hasText(movie.getDirector())) {
            Double directorScore = context.directorScores().get(movie.getDirector().toLowerCase());
            if (directorScore != null) {
                candidate.addScore(directorScore, "Matches preferred director: " + movie.getDirector());
            }
        }

        if (movie.getReleaseDate() != null) {
            candidate.addScore(0.25, "New catalog candidate");
        }
        return candidate;
    }
}
