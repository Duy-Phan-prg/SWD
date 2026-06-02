package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.movie.ActorResponse;
import com.sba301.cinemaai.dto.movie.MovieResponse;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.service.ActorService;
import com.sba301.cinemaai.service.MovieService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/actors")
@RequiredArgsConstructor
@Tag(name = "Actors", description = "Public actor endpoints")
public class ActorController {

    private final ActorService actorService;
    private final MovieService movieService;

    @GetMapping
    @Operation(summary = "List actors", description = "List actors with movie count")
    public ApiResponse<List<ActorResponse>> getActors() {
        return ApiResponse.success(actorService.getActors());
    }

    @GetMapping("/{actorId}")
    @Operation(summary = "Get actor details", description = "Get actor details with movie count")
    public ApiResponse<ActorResponse> getActor(@PathVariable Long actorId) {
        return ApiResponse.success(actorService.getActor(actorId));
    }

    @GetMapping("/{actorId}/movies")
    @Operation(summary = "Get movies by actor", description = "List public movies that include an actor")
    public ApiResponse<List<MovieResponse>> getMoviesByActor(@PathVariable Long actorId) {
        return ApiResponse.success(movieService.getMoviesByActor(actorId));
    }
}
