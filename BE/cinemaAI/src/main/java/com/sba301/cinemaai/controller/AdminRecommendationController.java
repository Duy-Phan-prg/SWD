package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.response.recommendation.RecommendationDebugResponse;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/recommendations")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Recommendations", description = "Admin recommendation debug endpoints")
public class AdminRecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/users/{userId}/debug")
    @Operation(summary = "Debug user recommendations", description = "Inspect profile signals and recommended movies")
    public ApiResponse<RecommendationDebugResponse> debugUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(recommendationService.debugUser(userId, limit));
    }
}
