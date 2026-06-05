package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.request.analysis.AIAnalysisDecisionRequest;
import com.sba301.cinemaai.dto.response.analysis.AIAnalysisResponse;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.security.AuthenticatedUser;
import com.sba301.cinemaai.service.AIAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Movie Analysis", description = "Admin AI movie analysis endpoints - requires ADMIN role")
public class AdminMovieAnalysisController {

    private final AIAnalysisService analysisService;

    @PostMapping("/movies/{movieId}/analyses")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Request movie analysis (Admin)", description = "Request AI analysis for a movie (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Analysis completed successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Movie not found")
    })
    public ApiResponse<AIAnalysisResponse> requestAnalysis(@PathVariable Long movieId) {
        return ApiResponse.success(analysisService.requestAnalysis(movieId), "Analysis completed successfully");
    }

    @GetMapping("/movies/{movieId}/analyses")
    @Operation(summary = "Get movie analyses (Admin)", description = "Get all analyses for a movie (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Analyses retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Movie not found")
    })
    public ApiResponse<List<AIAnalysisResponse>> getMovieAnalyses(@PathVariable Long movieId) {
        return ApiResponse.success(analysisService.getMovieAnalyses(movieId));
    }

    @GetMapping("/analyses/{analysisId}")
    @Operation(summary = "Get analysis details (Admin)", description = "Get detailed information about an analysis (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Analysis retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Analysis not found")
    })
    public ApiResponse<AIAnalysisResponse> getAnalysis(@PathVariable Long analysisId) {
        return ApiResponse.success(analysisService.getAdmin(analysisId));
    }

    @PostMapping("/analyses/{analysisId}/regenerate")
    @Operation(summary = "Regenerate analysis (Admin)", description = "Regenerate AI analysis for a movie (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Analysis regenerated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Analysis not found")
    })
    public ApiResponse<AIAnalysisResponse> regenerate(@PathVariable Long analysisId) {
        return ApiResponse.success(analysisService.regenerate(analysisId), "Analysis regenerated successfully");
    }

    @PostMapping("/analyses/{analysisId}/approve")
    @Operation(summary = "Approve analysis (Admin)", description = "Approve an AI analysis (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Analysis approved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request body"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Analysis not found")
    })
    public ApiResponse<AIAnalysisResponse> approve(
            @PathVariable Long analysisId,
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody(required = false) AIAnalysisDecisionRequest request
    ) {
        String reason = request == null ? null : request.reason();
        return ApiResponse.success(analysisService.approve(analysisId, user.id(), reason), "Analysis approved successfully");
    }

    @PostMapping("/analyses/{analysisId}/reject")
    @Operation(summary = "Reject analysis (Admin)", description = "Reject an AI analysis (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Analysis rejected successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request body"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Analysis not found")
    })
    public ApiResponse<AIAnalysisResponse> reject(
            @PathVariable Long analysisId,
            @Valid @RequestBody(required = false) AIAnalysisDecisionRequest request
    ) {
        String reason = request == null ? null : request.reason();
        return ApiResponse.success(analysisService.reject(analysisId, reason), "Analysis rejected successfully");
    }

    @DeleteMapping("/analyses/{analysisId}")
    public ApiResponse<Void> delete(@PathVariable Long analysisId) {
        analysisService.delete(analysisId);
        return ApiResponse.success(null, "Analysis deleted successfully");
    }
}
