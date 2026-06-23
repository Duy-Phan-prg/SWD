package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.recommendation.TrailerInteractionRequest;
import com.sba301.cinemaai.dto.response.recommendation.FavoriteActorRecommendationResponse;
import com.sba301.cinemaai.dto.response.recommendation.MovieRecommendationResponse;
import com.sba301.cinemaai.dto.response.recommendation.RecommendationDebugResponse;
import com.sba301.cinemaai.dto.response.recommendation.TrailerInteractionResponse;
import com.sba301.cinemaai.dto.response.recommendation.UserPreferenceProfileResponse;
import java.util.List;

public interface RecommendationService {

        TrailerInteractionResponse recordTrailerInteraction(String email, TrailerInteractionRequest request);

        UserPreferenceProfileResponse refreshProfile(String email);

        /**
         * Làm mới profile bất đồng bộ (dùng khi trigger từ service khác, ví dụ ReviewService).
         * Không throw exception – lỗi chỉ được log.
         */
        void refreshProfileAsync(String email);

        UserPreferenceProfileResponse getProfile(String email);

        List<MovieRecommendationResponse> recommendMovies(String email, int limit);

        List<FavoriteActorRecommendationResponse> recommendByFavoriteActors(String email, int limit);

        RecommendationDebugResponse debugUser(Long userId, int limit);
}
