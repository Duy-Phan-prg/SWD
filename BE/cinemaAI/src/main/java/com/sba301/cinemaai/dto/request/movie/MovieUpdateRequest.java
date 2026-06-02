package com.sba301.cinemaai.dto.request.movie;

import com.sba301.cinemaai.enums.MovieStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record MovieUpdateRequest(
        @NotBlank(message = "Title is required")
        String title,

        String description,

        @Size(max = 500, message = "Trailer URL must be at most 500 characters")
        String trailerUrl,

        @Size(max = 500, message = "Poster URL must be at most 500 characters")
        String posterUrl,

        @Size(max = 500, message = "Avatar URL must be at most 500 characters")
        String avatarUrl,

        @Min(value = 1, message = "Duration must be positive")
        int durationMinutes,

        LocalDate releaseDate,
        String language,
        String subtitleLanguage,

        @NotNull(message = "Status is required")
        MovieStatus status,

        String ageRating,
        String director,

        @NotBlank(message = "Main actors are required")
        String mainActors,

        String castList,
        List<Long> genreIds
) {
}
