package com.sba301.cinemaai.ai.client;

import com.sba301.cinemaai.ai.dto.request.ChatRequest;
import com.sba301.cinemaai.ai.dto.response.RecommendMovieResponse;
import com.sba301.cinemaai.config.AIProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AIClient {

    private final RestTemplate restTemplate;
    private final AIProperties aiProperties;

    private String url(String path) {
        return aiProperties.getUrl() + path;
    }

    public List<RecommendMovieResponse> content(Long movieId) {
        RecommendMovieResponse[] result = restTemplate.getForObject(
                url("/recommend/content/" + movieId),
                RecommendMovieResponse[].class
        );

        return result == null ? List.of() : Arrays.asList(result);
    }

    public List<RecommendMovieResponse> collaborative(Long userId) {
        RecommendMovieResponse[] result = restTemplate.getForObject(
                url("/recommend/collaborative/" + userId),
                RecommendMovieResponse[].class
        );

        return result == null ? List.of() : Arrays.asList(result);
    }

    public String chat(ChatRequest request) {
        return restTemplate.postForObject(
                url("/chat"),
                request,
                String.class
        );
    }
}
