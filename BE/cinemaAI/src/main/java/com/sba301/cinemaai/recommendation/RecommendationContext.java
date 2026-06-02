package com.sba301.cinemaai.recommendation;

import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.UserPreferenceProfile;
import java.util.Map;
import java.util.Set;

public record RecommendationContext(
        User user,
        UserPreferenceProfile profile,
        Map<Long, Double> genreScores,
        Map<Long, Double> actorScores,
        Map<String, Double> directorScores,
        Set<Long> watchedMovieIds
) {
}
