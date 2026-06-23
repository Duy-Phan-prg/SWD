package com.sba301.cinemaai.config;

import com.sba301.cinemaai.recommendation.HybridContentBasedStrategy;
import com.sba301.cinemaai.recommendation.MockRecommendationStrategy;
import com.sba301.cinemaai.recommendation.RecommendationStrategy;
import com.sba301.cinemaai.recommendation.SignalWeights;
import com.sba301.cinemaai.repository.MovieActorRepository;
import com.sba301.cinemaai.repository.MovieGenreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Đăng ký bean {@link RecommendationStrategy} duy nhất cho toàn ứng dụng.
 *
 * <p>Mặc định sử dụng {@link HybridContentBasedStrategy} – kết hợp nhiều tín hiệu
 * (trailer, booking, ticket count, review, wishlist) với trọng số có thể cấu hình.</p>
 *
 * <p>{@link MockRecommendationStrategy} vẫn được giữ lại làm fallback tham khảo,
 * nhưng không được đăng ký là bean Spring để tránh xung đột.</p>
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(SignalWeights.class)
public class RecommendationConfig {

    private final MovieGenreRepository movieGenreRepository;
    private final MovieActorRepository movieActorRepository;

    @Bean
    public RecommendationStrategy recommendationStrategy(SignalWeights signalWeights) {
        log.info("[Recommendation] Khởi tạo HybridContentBasedStrategy "
                + "(booking={}, trailer_complete={}, wishlist={}, review_high_mult={})",
                signalWeights.getBooking(),
                signalWeights.getTrailerComplete(),
                signalWeights.getWishlist(),
                signalWeights.getReviewHighMultiplier());
        return new HybridContentBasedStrategy(signalWeights, movieGenreRepository, movieActorRepository);
    }
}
