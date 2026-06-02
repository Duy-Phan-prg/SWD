package com.sba301.cinemaai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "actors")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Actor extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 1000)
    private String biography;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    public Actor(String name, String biography, String avatarUrl) {
        this.name = name;
        this.biography = biography;
        this.avatarUrl = avatarUrl;
    }

    public void update(String name, String biography, String avatarUrl) {
        this.name = name;
        this.biography = biography;
        this.avatarUrl = avatarUrl;
    }
}
