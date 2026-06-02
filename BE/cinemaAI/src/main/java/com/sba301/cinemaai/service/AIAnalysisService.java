package com.sba301.cinemaai.service;

import com.sba301.cinemaai.analysis.AIResultParser;
import com.sba301.cinemaai.analysis.MovieAnalysisResult;
import com.sba301.cinemaai.analysis.MovieAnalysisStrategy;
import com.sba301.cinemaai.analysis.PromptBuilder;
import com.sba301.cinemaai.dto.response.analysis.AIAnalysisResponse;
import com.sba301.cinemaai.entity.AIAnalysis;
import com.sba301.cinemaai.entity.AIEmotionSegment;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.enums.AIAnalysisStatus;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.mapper.AIAnalysisMapper;
import com.sba301.cinemaai.repository.AIAnalysisRepository;
import com.sba301.cinemaai.repository.AIEmotionSegmentRepository;
import com.sba301.cinemaai.repository.MovieRepository;
import com.sba301.cinemaai.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AIAnalysisService {

    private final AIAnalysisRepository analysisRepository;
    private final AIEmotionSegmentRepository segmentRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;
    private final MovieAnalysisStrategy analysisStrategy;
    private final PromptBuilder promptBuilder;
    private final AIResultParser resultParser;
    private final AIAnalysisMapper analysisMapper;

    @Transactional
    public AIAnalysisResponse requestAnalysis(Long movieId) {
        Movie movie = findMovie(movieId);
        AIAnalysis analysis = analysisRepository.save(new AIAnalysis(movie));
        runAnalysis(analysis, movie);
        return toResponse(analysis);
    }

    @Transactional
    public AIAnalysisResponse regenerate(Long analysisId) {
        AIAnalysis analysis = findAnalysis(analysisId);
        segmentRepository.deleteByAnalysis(analysis);
        runAnalysis(analysis, analysis.getMovie());
        return toResponse(analysis);
    }

    @Transactional
    public AIAnalysisResponse approve(Long analysisId, Long userId, String reason) {
        AIAnalysis analysis = findAnalysis(analysisId);
        if (analysis.getStatus() != AIAnalysisStatus.DONE && analysis.getStatus() != AIAnalysisStatus.APPROVED) {
            throw new BadRequestException("Only completed analysis can be approved");
        }
        User approver = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Approver not found"));
        analysis.approve(approver, normalizeReason(reason));
        return toResponse(analysis);
    }

    @Transactional
    public AIAnalysisResponse reject(Long analysisId, String reason) {
        AIAnalysis analysis = findAnalysis(analysisId);
        if (analysis.getStatus() != AIAnalysisStatus.DONE && analysis.getStatus() != AIAnalysisStatus.APPROVED) {
            throw new BadRequestException("Only completed analysis can be rejected");
        }
        analysis.reject(normalizeReason(reason));
        return toResponse(analysis);
    }

    @Transactional(readOnly = true)
    public List<AIAnalysisResponse> getMovieAnalyses(Long movieId) {
        Movie movie = findMovie(movieId);
        return analysisRepository.findByMovieOrderByCreatedAtDesc(movie)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AIAnalysisResponse getAdmin(Long analysisId) {
        return toResponse(findAnalysis(analysisId));
    }

    @Transactional(readOnly = true)
    public AIAnalysisResponse getPublicApproved(Long movieId) {
        Movie movie = findMovie(movieId);
        AIAnalysis analysis = analysisRepository
                .findFirstByMovieAndStatusOrderByApprovedAtDesc(movie, AIAnalysisStatus.APPROVED)
                .orElseThrow(() -> new NotFoundException("Approved analysis not found"));
        return toResponse(analysis);
    }

    @Transactional
    public void delete(Long analysisId) {
        AIAnalysis analysis = findAnalysis(analysisId);
        segmentRepository.deleteByAnalysis(analysis);
        analysisRepository.delete(analysis);
    }

    private void runAnalysis(AIAnalysis analysis, Movie movie) {
        try {
            analysis.markProcessing();
            MovieAnalysisResult result = resultParser.parse(analysisStrategy.analyze(promptBuilder.build(movie)));
            analysis.applyResult(
                    result.overallScore(),
                    result.violenceScore(),
                    result.romanceScore(),
                    result.humorScore(),
                    result.contentLabel(),
                    result.targetAudience(),
                    result.summary(),
                    result.providerRawResponse()
            );
            result.emotionSegments()
                    .stream()
                    .map(segment -> new AIEmotionSegment(
                            analysis,
                            segment.startMinute(),
                            segment.endMinute(),
                            segment.emotionType(),
                            segment.intensity(),
                            segment.description()
                    ))
                    .forEach(segmentRepository::save);
        } catch (RuntimeException exception) {
            analysis.markFailed(exception.getMessage());
            throw exception;
        }
    }

    private AIAnalysisResponse toResponse(AIAnalysis analysis) {
        return analysisMapper.toResponse(analysis, segmentRepository.findByAnalysisOrderByStartMinuteAsc(analysis));
    }

    private AIAnalysis findAnalysis(Long analysisId) {
        return analysisRepository.findById(analysisId)
                .orElseThrow(() -> new NotFoundException("Analysis not found"));
    }

    private Movie findMovie(Long movieId) {
        return movieRepository.findById(movieId)
                .orElseThrow(() -> new NotFoundException("Movie not found"));
    }

    private String normalizeReason(String reason) {
        if (reason == null || reason.isBlank()) {
            return null;
        }
        return reason.trim();
    }
}
