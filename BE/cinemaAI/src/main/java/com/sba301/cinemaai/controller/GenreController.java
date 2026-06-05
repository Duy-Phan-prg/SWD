package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.response.movie.GenreResponse;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.service.GenreService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/genres")
@RequiredArgsConstructor
public class GenreController {

    private final GenreService genreService;

    @GetMapping
    public ApiResponse<List<GenreResponse>> getGenres() {
        return ApiResponse.success(genreService.getGenres());
    }

    @GetMapping("/{genreId}")
    public ApiResponse<GenreResponse> getGenre(@PathVariable Long genreId) {
        return ApiResponse.success(genreService.getGenre(genreId));
    }
}
