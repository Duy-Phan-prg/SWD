package com.sba301.cinemaai.entity;

import com.sba301.cinemaai.enums.FoodItemStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "food_combos")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FoodCombo extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Lob
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FoodItemStatus status = FoodItemStatus.ACTIVE;

    public FoodCombo(String name, String description, BigDecimal price) {
        updateDetails(name, description, price, null);
    }

    public void updateDetails(String name, String description, BigDecimal price, String imageUrl) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.imageUrl = imageUrl;
    }

    public void changeStatus(FoodItemStatus status) {
        this.status = status;
    }
}
