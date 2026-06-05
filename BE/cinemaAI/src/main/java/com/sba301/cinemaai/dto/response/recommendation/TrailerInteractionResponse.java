package com.sba301.cinemaai.dto.response.recommendation;

import com.sba301.cinemaai.enums.TrailerInteractionType;
import java.time.LocalDateTime;

public record TrailerInteractionResponse(
        Long id,
        Long movieId,
        String movieTitle,
        TrailerInteractionType interactionType,
        Integer watchedSeconds,
        Integer totalSeconds,
        LocalDateTime createdAt
) {
}
