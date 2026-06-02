package com.sba301.cinemaai.dto.response.analysis;

import com.sba301.cinemaai.enums.EmotionType;

public record AIEmotionSegmentResponse(
        Long id,
        int startMinute,
        int endMinute,
        EmotionType emotionType,
        int intensity,
        String description
) {
}
