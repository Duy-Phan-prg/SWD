package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.request.cinema.CinemaRequest;
import com.sba301.cinemaai.dto.response.cinema.CinemaResponse;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.enums.CinemaStatus;
import com.sba301.cinemaai.service.CinemaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Cinema", description = "Admin single-cinema management endpoints - requires ADMIN role")
public class AdminCinemaController {

    private final CinemaService cinemaService;

    @GetMapping({"/api/v1/admin/cinema", "/api/v1/admin/cinemas"})
    @Operation(summary = "Get configured cinema (Admin)", description = "Get the single configured cinema (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cinema retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role")
    })
    public ApiResponse<CinemaResponse> getCinema() {
        return ApiResponse.success(cinemaService.getAdminCinema());
    }

    @GetMapping("/api/v1/admin/cinemas/{cinemaId}")
    @Operation(summary = "Get configured cinema by ID (Admin)", description = "Legacy endpoint for the single configured cinema (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cinema retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Cinema not found")
    })
    public ApiResponse<CinemaResponse> getCinemaById(@PathVariable Long cinemaId) {
        return ApiResponse.success(cinemaService.getCinema(cinemaId));
    }

    @PostMapping({"/api/v1/admin/cinema", "/api/v1/admin/cinemas"})
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create or replace configured cinema (Admin)", description = "Create the cinema if missing, otherwise update the configured cinema (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Cinema created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request body"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role")
    })
    public ApiResponse<CinemaResponse> createCinema(@Valid @RequestBody CinemaRequest request) {
        return ApiResponse.success(cinemaService.create(request), "Cinema saved successfully");
    }

    @PutMapping("/api/v1/admin/cinema")
    @Operation(summary = "Update configured cinema (Admin)", description = "Update the single configured cinema (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cinema updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request body"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Cinema not found")
    })
    public ApiResponse<CinemaResponse> updateCinema(@Valid @RequestBody CinemaRequest request) {
        return ApiResponse.success(cinemaService.update(request), "Cinema updated successfully");
    }

    @PutMapping("/api/v1/admin/cinemas/{cinemaId}")
    @Operation(summary = "Update configured cinema by ID (Admin)", description = "Legacy endpoint for updating the single configured cinema (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cinema updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request body"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Cinema not found")
    })
    public ApiResponse<CinemaResponse> updateCinemaById(
            @PathVariable Long cinemaId,
            @Valid @RequestBody CinemaRequest request
    ) {
        return ApiResponse.success(cinemaService.update(cinemaId, request), "Cinema updated successfully");
    }

    @PatchMapping("/api/v1/admin/cinema/status")
    @Operation(summary = "Update configured cinema status (Admin)", description = "Update the status of the single configured cinema (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cinema status updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Cinema not found")
    })
    public ApiResponse<CinemaResponse> updateStatus(@RequestParam CinemaStatus status) {
        return ApiResponse.success(cinemaService.updateStatus(status), "Cinema status updated successfully");
    }

    @PatchMapping("/api/v1/admin/cinemas/{cinemaId}/status")
    @Operation(summary = "Update configured cinema status by ID (Admin)", description = "Legacy endpoint for updating the single configured cinema status (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cinema status updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Cinema not found")
    })
    public ApiResponse<CinemaResponse> updateStatusById(
            @PathVariable Long cinemaId,
            @RequestParam CinemaStatus status
    ) {
        return ApiResponse.success(cinemaService.updateStatus(cinemaId, status), "Cinema status updated successfully");
    }

    @DeleteMapping("/api/v1/admin/cinema")
    @Operation(summary = "Deactivate configured cinema (Admin)", description = "Deactivate the single configured cinema (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cinema deactivated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Cinema not found")
    })
    public ApiResponse<Void> deleteCinema() {
        cinemaService.delete();
        return ApiResponse.success(null, "Cinema deactivated successfully");
    }

    @DeleteMapping("/api/v1/admin/cinemas/{cinemaId}")
    @Operation(summary = "Deactivate configured cinema by ID (Admin)", description = "Legacy endpoint for deactivating the single configured cinema (Admin only)")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cinema deactivated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized - JWT token missing or invalid"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Forbidden - User does not have ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Cinema not found")
    })
    public ApiResponse<Void> deleteCinemaById(@PathVariable Long cinemaId) {
        cinemaService.delete(cinemaId);
        return ApiResponse.success(null, "Cinema deactivated successfully");
    }
}
