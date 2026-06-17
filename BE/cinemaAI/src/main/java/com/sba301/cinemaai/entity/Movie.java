package com.sba301.cinemaai.entity;

import com.sba301.cinemaai.enums.AgeRating;
import com.sba301.cinemaai.enums.AgeRatingConverter;
import com.sba301.cinemaai.enums.MovieStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "movies",
        indexes = {
                @Index(name = "idx_movies_status", columnList = "status"),
                @Index(name = "idx_movies_release_date", columnList = "release_date")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Movie extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String title;

    @Column(name = "english_title", length = 30)
    private String englishTitle;

    @Lob
    @Column(length = 1000)
    private String description;

    @Column(name = "trailer_url", length = 500)
    private String trailerUrl;

    @Column(name = "poster_url", length = 500)
    private String posterUrl;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(length = 30)
    private String language;

    @Column(name = "subtitle_language", length = 30)
    private String subtitleLanguage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MovieStatus status = MovieStatus.UPCOMING;

    @Convert(converter = AgeRatingConverter.class)
    @Column(name = "age_rating", length = 20)
    private AgeRating ageRating;

    @Column(length = 50)
    private String director;

    @Column(name = "main_actors", length = 1000)
    private String mainActors;

    @Column(name = "cast_list", columnDefinition = "TEXT")
    private String castList;

    public Movie(String title, int durationMinutes, MovieStatus status) {
        this.title = title;
        this.durationMinutes = durationMinutes;
        this.status = status;
    }

    public void updateDetails(String title, String description, int durationMinutes, LocalDate releaseDate) {
        updateDetails(title, this.englishTitle, description, durationMinutes, releaseDate);
    }

    public void updateDetails(String title, String englishTitle, String description, int durationMinutes, LocalDate releaseDate) {
        this.title = title;
        this.englishTitle = englishTitle;
        this.description = description;
        this.durationMinutes = durationMinutes;
        this.releaseDate = releaseDate;
    }

    public void updateMedia(String trailerUrl, String posterUrl, String avatarUrl) {
        this.trailerUrl = trailerUrl;
        this.posterUrl = posterUrl;
        this.avatarUrl = avatarUrl;
    }

    public void updateMetadata(
            String language,
            String subtitleLanguage,
            String ageRating,
            String director,
            String mainActors,
            String castList
    ) {
        updateMetadata(language, subtitleLanguage, AgeRating.from(ageRating), director, mainActors, castList);
    }

    public void updateMetadata(
            String language,
            String subtitleLanguage,
            AgeRating ageRating,
            String director,
            String mainActors,
            String castList
    ) {
        this.language = language;
        this.subtitleLanguage = subtitleLanguage;
        this.ageRating = ageRating;
        this.director = director;
        this.mainActors = mainActors;
        this.castList = castList;
    }

    public void changeStatus(MovieStatus status) {
        this.status = status;
    }
}
