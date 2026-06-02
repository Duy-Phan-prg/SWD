package com.sba301.cinemaai.dto.movie;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ActorRequest(
        @NotBlank(message = "Actor name is required")
        String name,

        @Size(max = 1000, message = "Biography must be at most 1000 characters")
        String biography,

        @Size(max = 500, message = "Avatar URL must be at most 500 characters")
        String avatarUrl
) {
}
