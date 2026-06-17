package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.FoodItem;
import com.sba301.cinemaai.enums.FoodItemStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {

    List<FoodItem> findByStatus(FoodItemStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from FoodItem f where f.id = :id")
    Optional<FoodItem> findByIdForUpdate(@Param("id") Long id);
}
