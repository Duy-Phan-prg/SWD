package com.sba301.cinemaai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Entity
@Table(name = "user_preference_profiles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserPreferenceProfile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Lob
    @Column(name = "genre_scores")
    @Setter
    private String genreScores;

    @Lob
    @Column(name = "actor_scores")
    @Setter
    private String actorScores;

    @Lob
    @Column(name = "director_scores")
    @Setter
    private String directorScores;

    @Column(name = "cohort_key", length = 100)
    @Setter
    private String cohortKey;

    @Column(name = "last_refreshed_at")
    @Setter
    private LocalDateTime lastRefreshedAt;

    public UserPreferenceProfile(User user) {
        this.user = user;
    }

}
