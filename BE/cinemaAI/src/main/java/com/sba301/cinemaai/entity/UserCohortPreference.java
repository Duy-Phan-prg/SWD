package com.sba301.cinemaai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "user_cohort_preferences")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserCohortPreference extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cohort_key", nullable = false, unique = true, length = 100)
    private String cohortKey;

    @Lob
    @Column(name = "genre_scores")
    private String genreScores;

    @Lob
    @Column(name = "actor_scores")
    private String actorScores;

    @Column(name = "sample_size", nullable = false)
    private int sampleSize;

    public UserCohortPreference(String cohortKey) {
        this.cohortKey = cohortKey;
    }

    public void refresh(String genreScores, String actorScores, int sampleSize) {
        this.genreScores = genreScores;
        this.actorScores = actorScores;
        this.sampleSize = sampleSize;
    }
}
