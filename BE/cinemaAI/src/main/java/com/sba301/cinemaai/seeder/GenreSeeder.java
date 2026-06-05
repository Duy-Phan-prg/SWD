package com.sba301.cinemaai.seeder;

import com.sba301.cinemaai.entity.Genre;
import com.sba301.cinemaai.repository.GenreRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(20)
@RequiredArgsConstructor
public class GenreSeeder implements Seeder {

    private final GenreRepository genreRepository;

    @Override
    @Transactional
    public void seed() {
        Map<String, String> genres = Map.of(
                "Action", "Action movies",
                "Drama", "Drama movies",
                "Comedy", "Comedy movies",
                "Horror", "Horror movies",
                "Romance", "Romance movies",
                "Sci-Fi", "Science fiction movies"
        );

        genres.forEach((name, description) -> {
            if (!genreRepository.existsByName(name)) {
                genreRepository.save(new Genre(name, description));
            }
        });
    }
}
