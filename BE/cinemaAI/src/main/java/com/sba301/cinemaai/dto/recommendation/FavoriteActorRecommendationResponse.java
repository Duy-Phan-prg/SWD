package com.sba301.cinemaai.dto.recommendation;

import java.util.List;

public record FavoriteActorRecommendationResponse(
        Long actorId,
        String actorName,
        double preferenceScore,
        List<MovieRecommendationResponse> movies
) {
}
