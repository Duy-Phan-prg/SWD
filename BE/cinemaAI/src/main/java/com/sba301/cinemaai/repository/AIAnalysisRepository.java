package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.AIAnalysis;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.enums.AIAnalysisStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AIAnalysisRepository extends JpaRepository<AIAnalysis, Long> {

    List<AIAnalysis> findByMovieOrderByCreatedAtDesc(Movie movie);

    Optional<AIAnalysis> findFirstByMovieAndStatusOrderByCreatedAtDesc(Movie movie, AIAnalysisStatus status);

    Optional<AIAnalysis> findFirstByMovieAndStatusOrderByApprovedAtDesc(Movie movie, AIAnalysisStatus status);
}
