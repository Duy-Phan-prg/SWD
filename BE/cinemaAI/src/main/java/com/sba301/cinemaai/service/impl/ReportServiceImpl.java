package com.sba301.cinemaai.service.impl;

import com.sba301.cinemaai.dto.response.report.RevenueReportResponse;
import com.sba301.cinemaai.dto.response.report.RoomOccupancyResponse;
import com.sba301.cinemaai.dto.response.report.TopMovieResponse;
import com.sba301.cinemaai.repository.BookingRepository;
import com.sba301.cinemaai.repository.PaymentRepository;
import com.sba301.cinemaai.service.ReportService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    @Override
    public RevenueReportResponse getRevenue(LocalDate from, LocalDate to) {
        LocalDate safeFrom = from != null ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate safeTo = to != null ? to : LocalDate.now();
        LocalDateTime dtFrom = safeFrom.atStartOfDay();
        LocalDateTime dtTo = safeTo.plusDays(1).atStartOfDay();

        BigDecimal revenue = paymentRepository.sumRevenue(dtFrom, dtTo);
        long transactions = paymentRepository.countSuccessfulPayments(dtFrom, dtTo);
        long tickets = bookingRepository.countTicketsSold(dtFrom, dtTo);

        return new RevenueReportResponse(safeFrom, safeTo, revenue, transactions, tickets);
    }

    @Transactional(readOnly = true)
    @Override
    public List<TopMovieResponse> getTopMovies(LocalDate from, LocalDate to, int limit) {
        LocalDate safeFrom = from != null ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate safeTo = to != null ? to : LocalDate.now();
        LocalDateTime dtFrom = safeFrom.atStartOfDay();
        LocalDateTime dtTo = safeTo.plusDays(1).atStartOfDay();

        int safeLimit = Math.max(1, Math.min(limit, 50));
        return bookingRepository.topMoviesByTickets(dtFrom, dtTo)
                .stream()
                .limit(safeLimit)
                .map(row -> new TopMovieResponse(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue(),
                        row[3] != null ? new BigDecimal(row[3].toString()) : BigDecimal.ZERO
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    @Override
    public List<RoomOccupancyResponse> getRoomOccupancy(LocalDate from, LocalDate to) {
        LocalDate safeFrom = from != null ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate safeTo = to != null ? to : LocalDate.now();
        LocalDateTime dtFrom = safeFrom.atStartOfDay();
        LocalDateTime dtTo = safeTo.plusDays(1).atStartOfDay();

        return bookingRepository.occupancyByRoom(dtFrom, dtTo)
                .stream()
                .map(row -> {
                    long sold = ((Number) row[2]).longValue();
                    long capacity = ((Number) row[3]).longValue();
                    double rate = capacity > 0 ? (double) sold / capacity * 100.0 : 0.0;
                    return new RoomOccupancyResponse(
                            ((Number) row[0]).longValue(),
                            (String) row[1],
                            sold,
                            capacity,
                            Math.min(rate, 100.0)
                    );
                })
                .toList();
    }
}
