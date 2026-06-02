package com.sba301.cinemaai.dto.movie;

import java.time.LocalDateTime;

public record ActorResponse(
        Long id,
        String name,
        String biography,
        String avatarUrl,
        long movieCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
