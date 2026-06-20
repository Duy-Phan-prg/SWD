package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.FoodItem;
import com.sba301.cinemaai.enums.FoodItemStatus;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {

    List<FoodItem> findByStatus(FoodItemStatus status);

    Page<FoodItem> findByStatus(FoodItemStatus status, Pageable pageable);
}
