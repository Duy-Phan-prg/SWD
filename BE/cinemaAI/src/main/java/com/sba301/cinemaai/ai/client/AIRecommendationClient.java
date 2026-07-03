package com.sba301.cinemaai.ai.client;

import com.sba301.cinemaai.ai.dto.response.RecommendMovieResponse;
import com.sba301.cinemaai.config.AIProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AIRecommendationClient {

    private final RestTemplate restTemplate;
    private final AIProperties properties;

    public List<RecommendMovieResponse> content(Long movieId) {
        RecommendMovieResponse[] result = restTemplate.getForObject(
                properties.getUrl() + "/recommend/content/" + movieId,
                RecommendMovieResponse[].class
        );
        return result == null ? List.of() : Arrays.asList(result);
    }

    public List<RecommendMovieResponse> collaborative(Long userId) {
        RecommendMovieResponse[] result = restTemplate.getForObject(
                properties.getUrl() + "/recommend/collaborative/" + userId,
                RecommendMovieResponse[].class
        );
        return result == null ? List.of() : Arrays.asList(result);
    }

}
