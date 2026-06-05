package com.sba301.cinemaai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "ticket_combos")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TicketCombo extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "adult_count", nullable = false)
    private int adultCount;

    @Column(name = "child_count", nullable = false)
    private int childCount;

    @Column(name = "senior_count", nullable = false)
    private int seniorCount;

    @Column(name = "student_count", nullable = false)
    private int studentCount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private boolean active = true;

    public TicketCombo(
            String name,
            String description,
            int adultCount,
            int childCount,
            int seniorCount,
            int studentCount,
            BigDecimal price
    ) {
        this.name = name;
        this.description = description;
        this.adultCount = adultCount;
        this.childCount = childCount;
        this.seniorCount = seniorCount;
        this.studentCount = studentCount;
        this.price = price;
    }

    public void update(
            String name,
            String description,
            int adultCount,
            int childCount,
            int seniorCount,
            int studentCount,
            BigDecimal price,
            boolean active
    ) {
        this.name = name;
        this.description = description;
        this.adultCount = adultCount;
        this.childCount = childCount;
        this.seniorCount = seniorCount;
        this.studentCount = studentCount;
        this.price = price;
        this.active = active;
    }

    public void deactivate() {
        this.active = false;
    }
}
