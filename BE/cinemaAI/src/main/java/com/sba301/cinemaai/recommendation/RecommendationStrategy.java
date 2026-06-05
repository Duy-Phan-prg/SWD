package com.sba301.cinemaai.recommendation;

import com.sba301.cinemaai.entity.Movie;
import java.util.List;

public interface RecommendationStrategy {

    List<RecommendationCandidate> recommend(RecommendationContext context, List<Movie> candidates);
}
