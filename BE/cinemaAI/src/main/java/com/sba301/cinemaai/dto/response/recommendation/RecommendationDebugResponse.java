package com.sba301.cinemaai.dto.response.recommendation;

import java.util.List;

public record RecommendationDebugResponse(
        Long userId,
        UserPreferenceProfileResponse profile,
        int trailerInteractionCount,
        int bookingHistoryCount,
        int reviewCount,
        List<MovieRecommendationResponse> recommendations
) {
}
