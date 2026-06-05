package com.sba301.cinemaai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "pending_registrations")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PendingRegistration extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(length = 20)
    private String phone;

    @Column(name = "birth_year")
    private Integer birthYear;

    @Column(nullable = false, length = 6)
    private String otp;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    public PendingRegistration(
            String email,
            String passwordHash,
            String fullName,
            String phone,
            Integer birthYear,
            String otp,
            LocalDateTime expiresAt
    ) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.phone = phone;
        this.birthYear = birthYear;
        this.otp = otp;
        this.expiresAt = expiresAt;
    }

    public void refresh(String passwordHash, String fullName, String phone, Integer birthYear, String otp, LocalDateTime expiresAt) {
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.phone = phone;
        this.birthYear = birthYear;
        this.otp = otp;
        this.expiresAt = expiresAt;
    }
}
