package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.FoodCombo;
import com.sba301.cinemaai.enums.FoodItemStatus;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FoodComboRepository extends JpaRepository<FoodCombo, Long> {

    List<FoodCombo> findByStatus(FoodItemStatus status);

    Page<FoodCombo> findByStatus(FoodItemStatus status, Pageable pageable);
}
