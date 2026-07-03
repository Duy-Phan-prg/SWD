package com.sba301.cinemaai.ai.controller;

import com.sba301.cinemaai.ai.dto.response.RecommendMovieResponse;
import com.sba301.cinemaai.ai.service.RecommendationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Recommendation")
@RestController
@RequestMapping("/api/recommendation")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService service;

    @GetMapping("/content/{movieId}")
    public List<RecommendMovieResponse> content(@PathVariable Long movieId) {
        return service.content(movieId);
    }

    @GetMapping("/collaborative/{userId}")
    public List<RecommendMovieResponse> collaborative(@PathVariable Long userId) {
        return service.collaborative(userId);
    }

}
