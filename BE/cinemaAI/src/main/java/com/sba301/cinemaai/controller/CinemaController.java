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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class CinemaController {

    private final CinemaService cinemaService;
    private final RoomService roomService;

    @GetMapping({"/api/v1/cinema", "/api/v1/cinemas"})
    public ApiResponse<CinemaResponse> getCinema() {
        return ApiResponse.success(cinemaService.getPublicCinema());
    }

    @GetMapping("/api/v1/cinemas/{cinemaId}")
    public ApiResponse<CinemaResponse> getCinemaById(@PathVariable Long cinemaId) {
        return ApiResponse.success(cinemaService.getCinema(cinemaId));
    }

    @GetMapping("/api/v1/cinema/rooms")
    public ApiResponse<List<RoomResponse>> getRooms() {
        return ApiResponse.success(roomService.getRooms());
    }

    @GetMapping("/api/v1/cinemas/{cinemaId}/rooms")
    public ApiResponse<List<RoomResponse>> getRoomsByCinema(@PathVariable Long cinemaId) {
        return ApiResponse.success(roomService.getRoomsByCinema(cinemaId));
    }
}
