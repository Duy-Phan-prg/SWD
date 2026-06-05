package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.dto.response.promotion.ApplyPromotionResponse;
import com.sba301.cinemaai.dto.response.promotion.PromotionResponse;
import com.sba301.cinemaai.dto.request.promotion.ValidatePromotionRequest;
import com.sba301.cinemaai.service.PromotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/promotions")
@RequiredArgsConstructor
@Tag(name = "Promotion", description = "Endpoints for applying and managing promotions on bookings")
public class PromotionController {

    private final PromotionService promotionService;

    @GetMapping("/{code}")
    @Operation(
            summary = "Get promotion by code",
            description = "Returns promotion details if the code exists"
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Promotion found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Promotion not found")
    })
    public ResponseEntity<ApiResponse<PromotionResponse>> getByCode(
            @Parameter(description = "Promotion code", example = "SUMMER2024")
            @PathVariable String code
    ) {
        return ResponseEntity.ok(ApiResponse.success(promotionService.getByCode(code)));
    }

    @PostMapping("/apply")
    @Operation(
            summary = "Apply promotion to a booking",
            description = "Validates and applies a promotion code to the specified booking"
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Promotion applied successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid promotion or booking condition not met"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Booking or promotion not found")
    })
    public ResponseEntity<ApiResponse<ApplyPromotionResponse>> applyPromotion(
            @Parameter(description = "Booking ID", example = "1")
            @RequestParam Long bookingId,
            @Parameter(description = "Promotion code to apply", example = "SUMMER2024")
            @RequestParam String code
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                promotionService.applyPromotion(bookingId, code)));
    }

    @DeleteMapping("/remove")
    @Operation(
            summary = "Remove promotion from a booking",
            description = "Removes the applied promotion and recalculates booking total"
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Promotion removed successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "No promotion applied to this booking"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Booking not found")
    })
    public ResponseEntity<ApiResponse<Void>> removePromotion(
            @Parameter(description = "Booking ID", example = "1")
            @RequestParam Long bookingId
    ) {
        promotionService.removePromotion(bookingId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/validate")
    @Operation(
            summary = "Validate / preview promotion",
            description = "Checks if a promotion code is valid for the given order amount and returns the discount preview. Does NOT apply the promotion."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Promotion is valid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Promotion conditions not met"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Promotion not found or inactive")
    })
    public ResponseEntity<ApiResponse<ApplyPromotionResponse>> validate(
            @Valid @RequestBody ValidatePromotionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(promotionService.validatePromotion(request)));
    }
}