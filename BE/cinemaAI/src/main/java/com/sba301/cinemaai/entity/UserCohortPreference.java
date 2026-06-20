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
import lombok.Setter;

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
    @Setter
    private String genreScores;

    @Lob
    @Column(name = "actor_scores")
    @Setter
    private String actorScores;

    @Column(name = "sample_size", nullable = false)
    @Setter
    private int sampleSize;

    public UserCohortPreference(String cohortKey) {
        this.cohortKey = cohortKey;
    }

}
