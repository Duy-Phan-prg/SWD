package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.response.food.FoodComboResponse;
import com.sba301.cinemaai.dto.response.food.FoodItemResponse;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.service.FoodService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/foods")
@RequiredArgsConstructor
public class FoodController {

    private final FoodService foodService;

    @GetMapping("/items")
    public ApiResponse<List<FoodItemResponse>> getItems() {
        return ApiResponse.success(foodService.getActiveItems());
    }

    @GetMapping("/combos")
    public ApiResponse<List<FoodComboResponse>> getCombos() {
        return ApiResponse.success(foodService.getActiveCombos());
    }
}
