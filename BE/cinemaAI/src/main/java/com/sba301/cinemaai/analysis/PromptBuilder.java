package com.sba301.cinemaai.analysis;

import com.sba301.cinemaai.entity.Movie;
import org.springframework.stereotype.Component;

@Component
public class PromptBuilder {

    public MovieAnalysisPrompt build(Movie movie) {
        return new MovieAnalysisPrompt(
                movie.getId(),
                movie.getTitle(),
                movie.getDescription(),
                movie.getDurationMinutes(),
                movie.getLanguage(),
                movie.getAgeRating() == null ? null : movie.getAgeRating().getLabel(),
                movie.getDirector(),
                movie.getCastList()
        );
    }
}
