package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.response.cinema.CinemaResponse;
import com.sba301.cinemaai.dto.response.cinema.RoomResponse;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.service.CinemaService;
import com.sba301.cinemaai.service.RoomService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cinemas")
@RequiredArgsConstructor
public class CinemaController {

    private final CinemaService cinemaService;
    private final RoomService roomService;

    @GetMapping
    public ApiResponse<List<CinemaResponse>> getCinemas() {
        return ApiResponse.success(cinemaService.getPublicCinemas());
    }

    @GetMapping("/{cinemaId}")
    public ApiResponse<CinemaResponse> getCinema(@PathVariable Long cinemaId) {
        return ApiResponse.success(cinemaService.getCinema(cinemaId));
    }

    @GetMapping("/{cinemaId}/rooms")
    public ApiResponse<List<RoomResponse>> getRooms(@PathVariable Long cinemaId) {
        return ApiResponse.success(roomService.getRoomsByCinema(cinemaId));
    }
}
