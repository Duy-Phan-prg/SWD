package com.sba301.cinemaai.entity;

import com.sba301.cinemaai.enums.TrailerInteractionType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "trailer_interactions",
        indexes = {
                @Index(name = "idx_trailer_interactions_user", columnList = "user_id"),
                @Index(name = "idx_trailer_interactions_movie", columnList = "movie_id")
        }
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TrailerInteraction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @Enumerated(EnumType.STRING)
    @Column(name = "interaction_type", nullable = false, length = 30)
    private TrailerInteractionType interactionType;

    @Column(name = "watched_seconds")
    private Integer watchedSeconds;

    @Column(name = "total_seconds")
    private Integer totalSeconds;

    public TrailerInteraction(
            User user,
            Movie movie,
            TrailerInteractionType interactionType,
            Integer watchedSeconds,
            Integer totalSeconds
    ) {
        this.user = user;
        this.movie = movie;
        this.interactionType = interactionType;
        this.watchedSeconds = watchedSeconds;
        this.totalSeconds = totalSeconds;
    }
}
