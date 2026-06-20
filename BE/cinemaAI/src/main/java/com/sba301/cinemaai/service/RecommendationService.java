package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.recommendation.TrailerInteractionRequest;
import com.sba301.cinemaai.dto.response.recommendation.FavoriteActorRecommendationResponse;
import com.sba301.cinemaai.dto.response.recommendation.MovieRecommendationResponse;
import com.sba301.cinemaai.dto.response.recommendation.RecommendationDebugResponse;
import com.sba301.cinemaai.dto.response.recommendation.TrailerInteractionResponse;
import com.sba301.cinemaai.dto.response.recommendation.UserPreferenceProfileResponse;
import java.util.List;

public interface RecommendationService {

        public TrailerInteractionResponse recordTrailerInteraction(String email, TrailerInteractionRequest request);

        public UserPreferenceProfileResponse refreshProfile(String email);

        public UserPreferenceProfileResponse getProfile(String email);

        public List<MovieRecommendationResponse> recommendMovies(String email, int limit);

        public List<FavoriteActorRecommendationResponse> recommendByFavoriteActors(String email, int limit);

        public RecommendationDebugResponse debugUser(Long userId, int limit);
}
