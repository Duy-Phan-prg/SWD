package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.response.analysis.AIAnalysisResponse;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.service.AIAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/movies")
@RequiredArgsConstructor
public class MovieAnalysisController {

    private final AIAnalysisService analysisService;

    @GetMapping("/{movieId}/analysis")
    public ApiResponse<AIAnalysisResponse> getApprovedAnalysis(@PathVariable Long movieId) {
        return ApiResponse.success(analysisService.getPublicApproved(movieId));
    }
}
