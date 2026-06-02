package com.sba301.cinemaai.recommendation;

import com.sba301.cinemaai.entity.Movie;
import java.util.ArrayList;
import java.util.List;

public class RecommendationCandidate {

    private final Movie movie;
    private double score;
    private final List<String> reasons = new ArrayList<>();

    public RecommendationCandidate(Movie movie) {
        this.movie = movie;
    }

    public Movie getMovie() {
        return movie;
    }

    public double getScore() {
        return score;
    }

    public List<String> getReasons() {
        return reasons;
    }

    public void addScore(double value, String reason) {
        if (value == 0) {
            return;
        }
        this.score += value;
        this.reasons.add(reason);
    }
}
