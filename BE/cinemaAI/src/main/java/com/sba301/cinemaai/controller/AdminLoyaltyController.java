package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.request.loyalty.LoyaltyAddRequest;
import com.sba301.cinemaai.dto.response.loyalty.LoyaltyResponse;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.service.LoyaltyPointService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/loyalty")
@RequiredArgsConstructor
@Tag(name = "Admin - Loyalty", description = "Admin endpoints for managing user loyalty points")
public class AdminLoyaltyController {

    private final LoyaltyPointService loyaltyPointService;

    @PostMapping("/add")
    @Operation(
            summary = "Add points to a user",
            description = "Manually adds loyalty points to the specified user (ADMIN only)"
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Points added"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    public ApiResponse<LoyaltyResponse> addPoints(
            @Valid @RequestBody LoyaltyAddRequest request
    ) {
        return ApiResponse.success(
                loyaltyPointService.addPoints(request),
                "Points added successfully"
        );
    }

    @PostMapping("/{userId}/redeem")
    @Operation(
            summary = "Redeem points from a user",
            description = "Deducts redeemed loyalty points from the specified user (ADMIN only)"
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Points redeemed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Insufficient points or invalid input"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User not found")
    })
    public ApiResponse<LoyaltyResponse> redeemPoints(
            @Parameter(description = "Target user ID") @PathVariable Long userId,
            @Parameter(description = "Points to redeem") @RequestParam @Min(1) int points
    ) {
        return ApiResponse.success(
                loyaltyPointService.redeemPoints(userId, points),
                "Points redeemed successfully"
        );
    }
}
