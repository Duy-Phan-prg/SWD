package com.sba301.cinemaai.dto.response.recommendation;

import java.time.LocalDate;
import java.util.List;

public record MovieRecommendationResponse(
        Long movieId,
        String title,
        String ageRating,
        String director,
        LocalDate releaseDate,
        String posterUrl,
        double score,
        List<String> reasons
) {
}
