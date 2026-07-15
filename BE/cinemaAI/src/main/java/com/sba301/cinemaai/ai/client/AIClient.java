package com.sba301.cinemaai.ai.client;

import com.sba301.cinemaai.ai.dto.request.ChatRequest;
import com.sba301.cinemaai.ai.dto.response.RecommendMovieResponse;
import com.sba301.cinemaai.config.AIProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AIClient {

    private final RestTemplate restTemplate;
    private final AIProperties aiProperties;

    private String url(String path) {
        return aiProperties.getUrl() + path;
    }

    public List<RecommendMovieResponse> content(Long movieId) {
        try {
            RecommendMovieResponse[] result = restTemplate.getForObject(
                    url("/recommend/content/" + movieId),
                    RecommendMovieResponse[].class
            );
            return result == null ? List.of() : Arrays.asList(result);
        } catch (RestClientException e) {
            log.warn("AI Service unavailable for content recommendation (movieId={}): {}", movieId, e.getMessage());
            return List.of();
        }
    }

    public List<RecommendMovieResponse> collaborative(Long userId) {
        try {
            RecommendMovieResponse[] result = restTemplate.getForObject(
                    url("/recommend/collaborative/" + userId),
                    RecommendMovieResponse[].class
            );
            return result == null ? List.of() : Arrays.asList(result);
        } catch (RestClientException e) {
            log.warn("AI Service unavailable for collaborative recommendation (userId={}): {}", userId, e.getMessage());
            return List.of();
        }
    }

    public String chat(ChatRequest request) {
        try {
            return restTemplate.postForObject(url("/chat"), request, String.class);
        } catch (RestClientException e) {
            log.warn("AI Service unavailable for chat: {}", e.getMessage());
            return "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.";
        }
    }
}
