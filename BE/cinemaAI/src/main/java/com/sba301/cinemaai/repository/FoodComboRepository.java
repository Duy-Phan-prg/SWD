package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.FoodCombo;
import com.sba301.cinemaai.enums.FoodItemStatus;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FoodComboRepository extends JpaRepository<FoodCombo, Long> {

    List<FoodCombo> findByStatus(FoodItemStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from FoodCombo f where f.id = :id")
    Optional<FoodCombo> findByIdForUpdate(@Param("id") Long id);
}
