package com.sba301.cinemaai.dto.request.movie;

import com.sba301.cinemaai.enums.MovieStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record MovieCreateRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 50, message = "Title must be at most 50 characters")
        String title,

        @NotBlank(message = "English title is required")
        @Size(max = 30, message = "English title must be at most 30 characters")
        String englishTitle,

        @NotBlank(message = "Description is required")
        @Size(max = 1000, message = "Description must be at most 1000 characters")
        String description,

        @NotBlank(message = "Trailer URL is required")
        @Size(max = 500, message = "Trailer URL must be at most 500 characters")
        @Pattern(regexp = "^https?://.+$", message = "Trailer URL must start with http:// or https://")
        String trailerUrl,

        @NotBlank(message = "Poster URL is required")
        @Size(max = 500, message = "Poster URL must be at most 500 characters")
        @Pattern(regexp = "^https?://.+$", message = "Poster URL must start with http:// or https://")
        String posterUrl,

        @NotBlank(message = "Banner URL is required")
        @Size(max = 500, message = "Banner URL must be at most 500 characters")
        @Pattern(regexp = "^https?://.+$", message = "Banner URL must start with http:// or https://")
        String avatarUrl,

        @Min(value = 60, message = "Duration must be at least 60 minutes")
        @Max(value = 180, message = "Duration must be at most 180 minutes")
        int durationMinutes,

        @NotNull(message = "Release date is required")
        LocalDate releaseDate,

        @NotBlank(message = "Language is required")
        @Size(max = 30, message = "Language must be at most 30 characters")
        String language,

        @NotBlank(message = "Subtitle language is required")
        @Size(max = 30, message = "Subtitle language must be at most 30 characters")
        String subtitleLanguage,

        @NotNull(message = "Status is required")
        MovieStatus status,

        @NotBlank(message = "Age rating is required")
        @Size(max = 20, message = "Age rating must be at most 20 characters")
        String ageRating,

        @NotBlank(message = "Director is required")
        @Size(max = 50, message = "Director must be at most 50 characters")
        String director,

        @NotEmpty(message = "Genre ids are required")
        List<@NotNull(message = "Genre id is required") @Positive(message = "Genre id must be positive") Long> genreIds,

        @NotEmpty(message = "Actor ids are required")
        List<@NotNull(message = "Actor id is required") @Positive(message = "Actor id must be positive") Long> actorIds,

        @NotEmpty(message = "Main actor ids are required")
        List<@NotNull(message = "Main actor id is required") @Positive(message = "Main actor id must be positive") Long> mainActorIds
) {
}
