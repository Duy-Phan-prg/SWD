package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.request.promotion.PromotionCreateRequest;
import com.sba301.cinemaai.dto.response.promotion.PromotionResponse;
import com.sba301.cinemaai.dto.request.promotion.PromotionUpdateRequest;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.dto.response.PageResponse;
import com.sba301.cinemaai.service.PromotionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/promotions")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin - Promotion", description = "Admin endpoints for managing promotions")
public class AdminPromotionController {

    private final PromotionService promotionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create promotion", description = "Creates a new promotion code (ADMIN only)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Promotion created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input or duplicate code")
    })
    public ApiResponse<PromotionResponse> create(@Valid @RequestBody PromotionCreateRequest request) {
        return ApiResponse.success(promotionService.create(request), "Promotion created successfully");
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update promotion", description = "Updates an existing promotion by ID (ADMIN only)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Promotion updated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Promotion not found")
    })
    public ApiResponse<PromotionResponse> update(
            @Parameter(description = "Promotion ID") @PathVariable Long id,
            @Valid @RequestBody PromotionUpdateRequest request
    ) {
        return ApiResponse.success(promotionService.update(id, request), "Promotion updated successfully");
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete promotion", description = "Deletes a promotion by ID (ADMIN only)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "204", description = "Promotion deleted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Promotion not found")
    })
    public void delete(
            @Parameter(description = "Promotion ID") @PathVariable Long id
    ) {
        promotionService.delete(id);
    }

    @GetMapping
    @Operation(summary = "List all promotions", description = "Returns paginated list of all promotions (ADMIN only)")
    public ApiResponse<PageResponse<PromotionResponse>> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(promotionService.listAll(page, size));
    }

    @GetMapping("/{code}")
    @Operation(summary = "Get promotion by code", description = "Returns promotion detail by code (ADMIN only)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Promotion found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Promotion not found")
    })
    public ApiResponse<PromotionResponse> getByCode(
            @Parameter(description = "Promotion code", example = "SUMMER2026")
            @PathVariable String code
    ) {
        return ApiResponse.success(promotionService.getByCode(code));
    }
}
