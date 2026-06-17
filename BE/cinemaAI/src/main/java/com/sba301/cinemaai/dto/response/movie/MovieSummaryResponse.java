package com.sba301.cinemaai.dto.response.movie;

import com.sba301.cinemaai.enums.MovieStatus;
import java.time.LocalDate;
import java.util.List;

public record MovieSummaryResponse(
        Long id,
        String title,
        String englishTitle,
        String posterUrl,
        String bannerUrl,
        int durationMinutes,
        LocalDate releaseDate,
        MovieStatus status,
        String ageRating,
        List<GenreResponse> genres
) {
}
