package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.recommendation.FavoriteActorRecommendationResponse;
import com.sba301.cinemaai.dto.recommendation.MovieRecommendationResponse;
import com.sba301.cinemaai.dto.recommendation.TrailerInteractionRequest;
import com.sba301.cinemaai.dto.recommendation.TrailerInteractionResponse;
import com.sba301.cinemaai.dto.recommendation.UserPreferenceProfileResponse;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.security.AuthenticatedUser;
import com.sba301.cinemaai.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
@Tag(name = "Recommendations", description = "Personalized movie recommendation endpoints")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @PostMapping("/trailer-interactions")
    @Operation(summary = "Record trailer interaction", description = "Track click/view/skip/complete trailer behavior")
    public ApiResponse<TrailerInteractionResponse> recordTrailerInteraction(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody TrailerInteractionRequest request
    ) {
        return ApiResponse.success(
                recommendationService.recordTrailerInteraction(user.email(), request),
                "Trailer interaction recorded successfully"
        );
    }

    @PostMapping("/preferences/refresh")
    @Operation(summary = "Refresh my preference profile", description = "Aggregate trailer, booking and review signals")
    public ApiResponse<UserPreferenceProfileResponse> refreshProfile(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(recommendationService.refreshProfile(user.email()), "Preference profile refreshed");
    }

    @GetMapping("/preferences/me")
    @Operation(summary = "Get my preference profile", description = "Return the current preference profile")
    public ApiResponse<UserPreferenceProfileResponse> getProfile(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(recommendationService.getProfile(user.email()));
    }

    @GetMapping("/movies")
    @Operation(summary = "Get personalized movie recommendations")
    public ApiResponse<List<MovieRecommendationResponse>> recommendMovies(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(recommendationService.recommendMovies(user.email(), limit));
    }

    @GetMapping("/favorite-actors")
    @Operation(summary = "Get recommendations by favorite actors")
    public ApiResponse<List<FavoriteActorRecommendationResponse>> recommendByFavoriteActors(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(recommendationService.recommendByFavoriteActors(user.email(), limit));
    }
}
