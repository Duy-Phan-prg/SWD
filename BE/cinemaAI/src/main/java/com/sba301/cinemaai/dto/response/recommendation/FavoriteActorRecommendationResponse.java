package com.sba301.cinemaai.dto.response.recommendation;

import java.util.List;

public record FavoriteActorRecommendationResponse(
        Long actorId,
        String actorName,
        double preferenceScore,
        List<MovieRecommendationResponse> movies
) {
}
