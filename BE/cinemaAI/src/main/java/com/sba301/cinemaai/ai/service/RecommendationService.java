package com.sba301.cinemaai.ai.service;

import com.sba301.cinemaai.ai.dto.response.RecommendMovieResponse;

import java.util.List;

public interface RecommendationService {

    List<RecommendMovieResponse> content(Long movieId);

    List<RecommendMovieResponse> collaborative(Long userId);

}
