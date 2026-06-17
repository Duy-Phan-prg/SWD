package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.dto.response.food.FoodComboResponse;
import com.sba301.cinemaai.dto.response.food.FoodItemResponse;
import com.sba301.cinemaai.enums.FoodItemStatus;
import com.sba301.cinemaai.service.FoodService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/staff/foods")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Staff Foods", description = "Staff food availability endpoints - requires STAFF role")
public class StaffFoodController {

    private final FoodService foodService;

    @GetMapping("/items")
    public ApiResponse<List<FoodItemResponse>> getItems() {
        return ApiResponse.success(foodService.getAllItems());
    }

    @GetMapping("/combos")
    public ApiResponse<List<FoodComboResponse>> getCombos() {
        return ApiResponse.success(foodService.getAllCombos());
    }

    @PatchMapping("/items/{itemId}/status")
    public ApiResponse<FoodItemResponse> updateItemStatus(
            @PathVariable Long itemId,
            @RequestParam FoodItemStatus status
    ) {
        return ApiResponse.success(foodService.updateItemStatus(itemId, status), "Food item status updated successfully");
    }

    @PatchMapping("/combos/{comboId}/status")
    public ApiResponse<FoodComboResponse> updateComboStatus(
            @PathVariable Long comboId,
            @RequestParam FoodItemStatus status
    ) {
        return ApiResponse.success(foodService.updateComboStatus(comboId, status), "Food combo status updated successfully");
    }
}
