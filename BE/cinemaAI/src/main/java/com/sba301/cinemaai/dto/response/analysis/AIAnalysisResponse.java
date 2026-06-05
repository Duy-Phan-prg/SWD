package com.sba301.cinemaai.dto.response.analysis;

import com.sba301.cinemaai.enums.AIAnalysisStatus;
import com.sba301.cinemaai.enums.ContentLabel;
import com.sba301.cinemaai.enums.TargetAudience;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AIAnalysisResponse(
        Long id,
        Long movieId,
        String movieTitle,
        AIAnalysisStatus status,
        BigDecimal overallScore,
        BigDecimal violenceScore,
        BigDecimal romanceScore,
        BigDecimal humorScore,
        ContentLabel contentLabel,
        TargetAudience targetAudience,
        String summary,
        String providerRawResponse,
        Long approvedByUserId,
        LocalDateTime approvedAt,
        String decisionReason,
        List<AIEmotionSegmentResponse> emotionSegments,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
