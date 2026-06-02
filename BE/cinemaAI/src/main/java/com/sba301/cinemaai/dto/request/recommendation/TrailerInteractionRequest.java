package com.sba301.cinemaai.dto.request.recommendation;

import com.sba301.cinemaai.enums.TrailerInteractionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record TrailerInteractionRequest(
        @NotNull(message = "Movie id is required")
        Long movieId,

        @NotNull(message = "Interaction type is required")
        TrailerInteractionType interactionType,

        @PositiveOrZero(message = "Watched seconds must be zero or positive")
        Integer watchedSeconds,

        @PositiveOrZero(message = "Total seconds must be zero or positive")
        Integer totalSeconds
) {
}
