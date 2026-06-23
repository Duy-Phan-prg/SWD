package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.dto.response.report.RevenueReportResponse;
import com.sba301.cinemaai.dto.response.report.RoomOccupancyResponse;
import com.sba301.cinemaai.dto.response.report.TopMovieResponse;
import com.sba301.cinemaai.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Tag(name = "Admin - Reports", description = "Revenue, ticket sales, top movies and room occupancy reports")
public class AdminReportController {

    private final ReportService reportService;

    @GetMapping("/revenue")
    @Operation(
            summary = "Revenue report",
            description = "Total revenue, transaction count and tickets sold in the given date range. Defaults to current month."
    )
    public ApiResponse<RevenueReportResponse> revenue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ApiResponse.success(reportService.getRevenue(from, to));
    }

    @GetMapping("/top-movies")
    @Operation(
            summary = "Top movies by tickets sold",
            description = "Lists movies ranked by tickets sold descending. Returns up to `limit` rows (max 50)."
    )
    public ApiResponse<List<TopMovieResponse>> topMovies(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(reportService.getTopMovies(from, to, limit));
    }

    @GetMapping("/occupancy")
    @Operation(
            summary = "Room occupancy rate",
            description = "Tickets sold vs room capacity per room in the date range."
    )
    public ApiResponse<List<RoomOccupancyResponse>> occupancy(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ApiResponse.success(reportService.getRoomOccupancy(from, to));
    }
}
