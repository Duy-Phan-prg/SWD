package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.ticket.TicketComboRequest;
import com.sba301.cinemaai.dto.ticket.TicketComboResponse;
import com.sba301.cinemaai.dto.ticket.TicketLinePriceResponse;
import com.sba301.cinemaai.dto.ticket.TicketPriceValidationRequest;
import com.sba301.cinemaai.dto.ticket.TicketPriceValidationResponse;
import com.sba301.cinemaai.dto.ticket.TicketPricingRuleRequest;
import com.sba301.cinemaai.dto.ticket.TicketPricingRuleResponse;
import com.sba301.cinemaai.dto.ticket.TicketSelectionRequest;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.Showtime;
import com.sba301.cinemaai.entity.TicketCombo;
import com.sba301.cinemaai.entity.TicketPricingRule;
import com.sba301.cinemaai.enums.TicketType;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.ConflictException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.repository.ShowtimeRepository;
import com.sba301.cinemaai.repository.TicketComboRepository;
import com.sba301.cinemaai.repository.TicketPricingRuleRepository;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TicketPricingService {

    private final TicketPricingRuleRepository ticketPricingRuleRepository;
    private final TicketComboRepository ticketComboRepository;
    private final ShowtimeRepository showtimeRepository;

    @Transactional(readOnly = true)
    public List<TicketPricingRuleResponse> getRules() {
        return ticketPricingRuleRepository.findAll().stream()
                .map(this::toRuleResponse)
                .toList();
    }

    @Transactional
    public TicketPricingRuleResponse createRule(TicketPricingRuleRequest request) {
        TicketPricingRule rule = new TicketPricingRule(
                request.ticketType(),
                request.roomType(),
                request.weekend(),
                request.holiday(),
                request.price()
        );
        rule.update(
                request.ticketType(),
                request.roomType(),
                request.weekend(),
                request.holiday(),
                request.price(),
                request.active() == null || request.active()
        );
        return toRuleResponse(ticketPricingRuleRepository.save(rule));
    }

    @Transactional
    public TicketPricingRuleResponse updateRule(Long id, TicketPricingRuleRequest request) {
        TicketPricingRule rule = findRule(id);
        rule.update(
                request.ticketType(),
                request.roomType(),
                request.weekend(),
                request.holiday(),
                request.price(),
                request.active() == null || request.active()
        );
        return toRuleResponse(rule);
    }

    @Transactional
    public void deleteRule(Long id) {
        findRule(id).deactivate();
    }

    @Transactional(readOnly = true)
    public List<TicketComboResponse> getCombos(boolean activeOnly) {
        return (activeOnly ? ticketComboRepository.findByActiveTrue() : ticketComboRepository.findAll())
                .stream()
                .map(this::toComboResponse)
                .toList();
    }

    @Transactional
    public TicketComboResponse createCombo(TicketComboRequest request) {
        validateComboCounts(request);
        ticketComboRepository.findByNameIgnoreCase(request.name()).ifPresent(combo -> {
            throw new ConflictException("Ticket combo name already exists");
        });
        TicketCombo combo = new TicketCombo(
                request.name().trim(),
                request.description(),
                request.adultCount(),
                request.childCount(),
                request.seniorCount(),
                request.studentCount(),
                request.price()
        );
        combo.update(
                request.name().trim(),
                request.description(),
                request.adultCount(),
                request.childCount(),
                request.seniorCount(),
                request.studentCount(),
                request.price(),
                request.active() == null || request.active()
        );
        return toComboResponse(ticketComboRepository.save(combo));
    }

    @Transactional
    public TicketComboResponse updateCombo(Long id, TicketComboRequest request) {
        validateComboCounts(request);
        TicketCombo combo = findCombo(id);
        ticketComboRepository.findByNameIgnoreCase(request.name().trim())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ConflictException("Ticket combo name already exists");
                });
        combo.update(
                request.name().trim(),
                request.description(),
                request.adultCount(),
                request.childCount(),
                request.seniorCount(),
                request.studentCount(),
                request.price(),
                request.active() == null || request.active()
        );
        return toComboResponse(combo);
    }

    @Transactional
    public void deleteCombo(Long id) {
        findCombo(id).deactivate();
    }

    @Transactional(readOnly = true)
    public TicketPriceValidationResponse validatePrice(TicketPriceValidationRequest request) {
        Showtime showtime = showtimeRepository.findById(request.showtimeId())
                .orElseThrow(() -> new NotFoundException("Showtime not found"));
        Movie movie = showtime.getMovie();
        boolean weekend = isWeekend(showtime);
        List<TicketLinePriceResponse> ticketLines = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        boolean eligible = true;

        for (TicketSelectionRequest ticket : request.tickets()) {
            BigDecimal unitPrice = resolvePrice(showtime, ticket.ticketType(), weekend, request.holiday(), warnings);
            boolean ageAllowedByTicketType = ticket.ticketType().allowsAge(ticket.viewerAge());
            boolean ageAllowedByMovie = movie.getAgeRating() == null || movie.getAgeRating().allowsAge(ticket.viewerAge());
            boolean lineEligible = ageAllowedByTicketType && ageAllowedByMovie;
            String message = resolveTicketMessage(ticket, movie, ageAllowedByTicketType, ageAllowedByMovie);
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(ticket.quantity()));
            subtotal = subtotal.add(lineTotal);
            eligible = eligible && lineEligible;
            ticketLines.add(new TicketLinePriceResponse(
                    ticket.ticketType(),
                    ticket.viewerAge(),
                    ticket.quantity(),
                    unitPrice,
                    lineTotal,
                    lineEligible,
                    message
            ));
        }

        TicketCombo combo = request.comboId() == null ? null : findCombo(request.comboId());
        BigDecimal comboPrice = BigDecimal.ZERO;
        BigDecimal finalAmount = subtotal;
        if (combo != null) {
            boolean comboMatches = combo.isActive() && matchesCombo(combo, request.tickets());
            if (comboMatches) {
                comboPrice = combo.getPrice();
                finalAmount = comboPrice;
            } else {
                eligible = false;
                warnings.add("Ticket selection does not match combo " + combo.getName());
            }
        }

        return new TicketPriceValidationResponse(
                showtime.getId(),
                movie.getId(),
                movie.getTitle(),
                movie.getAgeRating() == null ? null : movie.getAgeRating().getLabel(),
                eligible,
                subtotal,
                comboPrice,
                finalAmount,
                ticketLines,
                warnings
        );
    }

    private BigDecimal resolvePrice(
            Showtime showtime,
            TicketType ticketType,
            boolean weekend,
            boolean holiday,
            List<String> warnings
    ) {
        return ticketPricingRuleRepository
                .findFirstByTicketTypeAndRoomTypeAndWeekendAndHolidayAndActiveTrueOrderByUpdatedAtDesc(
                        ticketType,
                        showtime.getRoom().getRoomType(),
                        weekend,
                        holiday
                )
                .map(TicketPricingRule::getPrice)
                .orElseGet(() -> {
                    warnings.add("No ticket pricing rule found for " + ticketType + "; using showtime base price");
                    return showtime.getBasePrice();
                });
    }

    private boolean matchesCombo(TicketCombo combo, List<TicketSelectionRequest> tickets) {
        Map<TicketType, Integer> counts = new EnumMap<>(TicketType.class);
        for (TicketSelectionRequest ticket : tickets) {
            counts.merge(ticket.ticketType(), ticket.quantity(), Integer::sum);
        }
        return counts.getOrDefault(TicketType.ADULT, 0) == combo.getAdultCount()
                && counts.getOrDefault(TicketType.CHILD, 0) == combo.getChildCount()
                && counts.getOrDefault(TicketType.SENIOR, 0) == combo.getSeniorCount()
                && counts.getOrDefault(TicketType.STUDENT, 0) == combo.getStudentCount();
    }

    private String resolveTicketMessage(
            TicketSelectionRequest ticket,
            Movie movie,
            boolean ageAllowedByTicketType,
            boolean ageAllowedByMovie
    ) {
        if (!ageAllowedByTicketType) {
            return "Viewer age is not valid for ticket type " + ticket.ticketType();
        }
        if (!ageAllowedByMovie) {
            return "Viewer age does not meet movie age rating " + movie.getAgeRating().getLabel();
        }
        return "Eligible";
    }

    private boolean isWeekend(Showtime showtime) {
        DayOfWeek day = showtime.getStartTime().getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }

    private void validateComboCounts(TicketComboRequest request) {
        int total = request.adultCount() + request.childCount() + request.seniorCount() + request.studentCount();
        if (total <= 0) {
            throw new BadRequestException("Ticket combo must contain at least one ticket");
        }
    }

    private TicketPricingRule findRule(Long id) {
        return ticketPricingRuleRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket pricing rule not found"));
    }

    private TicketCombo findCombo(Long id) {
        return ticketComboRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket combo not found"));
    }

    private TicketPricingRuleResponse toRuleResponse(TicketPricingRule rule) {
        return new TicketPricingRuleResponse(
                rule.getId(),
                rule.getTicketType(),
                rule.getRoomType(),
                rule.isWeekend(),
                rule.isHoliday(),
                rule.getPrice(),
                rule.isActive(),
                rule.getCreatedAt(),
                rule.getUpdatedAt()
        );
    }

    private TicketComboResponse toComboResponse(TicketCombo combo) {
        return new TicketComboResponse(
                combo.getId(),
                combo.getName(),
                combo.getDescription(),
                combo.getAdultCount(),
                combo.getChildCount(),
                combo.getSeniorCount(),
                combo.getStudentCount(),
                combo.getPrice(),
                combo.isActive(),
                combo.getCreatedAt(),
                combo.getUpdatedAt()
        );
    }
}
