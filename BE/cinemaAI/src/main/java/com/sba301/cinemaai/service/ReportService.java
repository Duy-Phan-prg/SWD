package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.response.report.RevenueReportResponse;
import com.sba301.cinemaai.dto.response.report.RoomOccupancyResponse;
import com.sba301.cinemaai.dto.response.report.TopMovieResponse;
import java.time.LocalDate;
import java.util.List;

public interface ReportService {

    RevenueReportResponse getRevenue(LocalDate from, LocalDate to);

    List<TopMovieResponse> getTopMovies(LocalDate from, LocalDate to, int limit);

    List<RoomOccupancyResponse> getRoomOccupancy(LocalDate from, LocalDate to);
}
