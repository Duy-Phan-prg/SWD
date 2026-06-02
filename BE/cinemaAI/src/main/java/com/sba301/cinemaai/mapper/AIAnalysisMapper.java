package com.sba301.cinemaai.mapper;

import com.sba301.cinemaai.dto.response.analysis.AIAnalysisResponse;
import com.sba301.cinemaai.dto.response.analysis.AIEmotionSegmentResponse;
import com.sba301.cinemaai.entity.AIAnalysis;
import com.sba301.cinemaai.entity.AIEmotionSegment;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class AIAnalysisMapper {

    public AIAnalysisResponse toResponse(AIAnalysis analysis, List<AIEmotionSegment> segments) {
        Long approvedByUserId = analysis.getApprovedBy() == null ? null : analysis.getApprovedBy().getId();
        return new AIAnalysisResponse(
                analysis.getId(),
                analysis.getMovie().getId(),
                analysis.getMovie().getTitle(),
                analysis.getStatus(),
                analysis.getOverallScore(),
                analysis.getViolenceScore(),
                analysis.getRomanceScore(),
                analysis.getHumorScore(),
                analysis.getContentLabel(),
                analysis.getTargetAudience(),
                analysis.getSummary(),
                analysis.getProviderRawResponse(),
                approvedByUserId,
                analysis.getApprovedAt(),
                analysis.getDecisionReason(),
                segments.stream().map(this::toSegmentResponse).toList(),
                analysis.getCreatedAt(),
                analysis.getUpdatedAt()
        );
    }

    private AIEmotionSegmentResponse toSegmentResponse(AIEmotionSegment segment) {
        return new AIEmotionSegmentResponse(
                segment.getId(),
                segment.getStartMinute(),
                segment.getEndMinute(),
                segment.getEmotionType(),
                segment.getIntensity(),
                segment.getDescription()
        );
    }
}
