package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.movie.ActorRequest;
import com.sba301.cinemaai.dto.movie.ActorResponse;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.service.ActorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/actors")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin Actors", description = "Admin actor management endpoints - requires ADMIN role")
public class AdminActorController {

    private final ActorService actorService;

    @GetMapping
    @Operation(summary = "List actors (Admin)", description = "List actors with movie count")
    public ApiResponse<List<ActorResponse>> getActors() {
        return ApiResponse.success(actorService.getActors());
    }

    @GetMapping("/{actorId}")
    @Operation(summary = "Get actor details (Admin)", description = "Get actor details with movie count")
    public ApiResponse<ActorResponse> getActor(@PathVariable Long actorId) {
        return ApiResponse.success(actorService.getActor(actorId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create actor (Admin)", description = "Create a new actor")
    public ApiResponse<ActorResponse> createActor(@Valid @RequestBody ActorRequest request) {
        return ApiResponse.success(actorService.create(request), "Actor created successfully");
    }

    @PutMapping("/{actorId}")
    @Operation(summary = "Update actor (Admin)", description = "Update actor information")
    public ApiResponse<ActorResponse> updateActor(
            @PathVariable Long actorId,
            @Valid @RequestBody ActorRequest request
    ) {
        return ApiResponse.success(actorService.update(actorId, request), "Actor updated successfully");
    }

    @DeleteMapping("/{actorId}")
    @Operation(summary = "Delete actor (Admin)", description = "Delete actor when not linked to movies")
    public ApiResponse<Void> deleteActor(@PathVariable Long actorId) {
        actorService.delete(actorId);
        return ApiResponse.success(null, "Actor deleted successfully");
    }
}
