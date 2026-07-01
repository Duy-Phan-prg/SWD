package com.sba301.cinemaai.seeder;

import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.MovieGenre;
import com.sba301.cinemaai.enums.AgeRating;
import com.sba301.cinemaai.enums.MovieStatus;
import com.sba301.cinemaai.repository.GenreRepository;
import com.sba301.cinemaai.repository.MovieGenreRepository;
import com.sba301.cinemaai.repository.MovieRepository;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(30)
@RequiredArgsConstructor
public class MovieSeeder implements Seeder {

    private final MovieRepository movieRepository;
    private final GenreRepository genreRepository;
    private final MovieGenreRepository movieGenreRepository;

    @Override
    @Transactional
    public void seed() {
        seedMovie(new MovieSeed(
                "The Last Orbit",
                "A rescue mission crosses the edge of known space.",
                128,
                MovieStatus.NOW_SHOWING,
                LocalDate.now().minusDays(14),
                LocalDate.now().plusDays(30),
                "English",
                "Vietnamese",
                "13+",
                "A. Nguyen",
                "Action,Sci-Fi"
        ));
        seedMovie(new MovieSeed(
                "Saigon Midnight",
                "A quiet detective story set across one rainy night.",
                112,
                MovieStatus.NOW_SHOWING,
                LocalDate.now().minusDays(7),
                LocalDate.now().plusDays(30),
                "Vietnamese",
                "English",
                "16+",
                "L. Tran",
                "Drama"
        ));
        seedMovie(new MovieSeed(
                "Weekend Laughs",
                "A group of friends turn a simple trip into chaos.",
                96,
                MovieStatus.UPCOMING,
                LocalDate.now().plusDays(10),
                LocalDate.now().plusDays(45),
                "Vietnamese",
                "English",
                "P",
                "M. Pham",
                "Comedy"
        ));
    }

    private void seedMovie(MovieSeed seed) {
        Movie movie = movieRepository.findByTitle(seed.title())
                .orElseGet(() -> movieRepository.save(new Movie(seed.title(), seed.durationMinutes(), seed.status())));
        movie.setTitle(seed.title());
        movie.setDurationMinutes(seed.durationMinutes());
        movie.setDescription(seed.description());
        movie.setReleaseDate(seed.releaseDate());
        movie.setEndDate(seed.endDate());
        movie.setLanguage(seed.language());
        movie.setSubtitleLanguage(seed.subtitleLanguage());
        movie.setAgeRating(AgeRating.from(seed.ageRating()));
        movie.setDirector(seed.director());
        movie.setMainActors("Sample lead actors");
        movie.setCastList("Sample cast");
        movie.setStatus(seed.status());
        movie.setPosterUrl("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRb30EroFOo6S_-d49SOIyTINg8t7Vpmm_lpcJ1zZ2xNA&s=10");
        movie.setAvatarUrl("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRb30EroFOo6S_-d49SOIyTINg8t7Vpmm_lpcJ1zZ2xNA&s=10");

        for (String genreName : seed.genreNames().split(",")) {
            genreRepository.findByName(genreName.trim()).ifPresent(genre -> {
                if (!movieGenreRepository.existsByMovieAndGenre(movie, genre)) {
                    movieGenreRepository.save(new MovieGenre(movie, genre));
                }
            });
        }
    }

    private record MovieSeed(
            String title,
            String description,
            int durationMinutes,
            MovieStatus status,
            LocalDate releaseDate,
            LocalDate endDate,
            String language,
            String subtitleLanguage,
            String ageRating,
            String director,
            String genreNames
    ) {
    }
}
