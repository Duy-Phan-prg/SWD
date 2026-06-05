package com.sba301.cinemaai.dto.response.recommendation;

import java.time.LocalDateTime;
import java.util.Map;

public record UserPreferenceProfileResponse(
        Long userId,
        String cohortKey,
        Map<Long, Double> genreScores,
        Map<Long, Double> actorScores,
        Map<String, Double> directorScores,
        LocalDateTime lastRefreshedAt
) {
}
