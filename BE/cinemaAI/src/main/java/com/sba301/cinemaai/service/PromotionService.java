package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.response.promotion.ApplyPromotionResponse;
import com.sba301.cinemaai.dto.request.promotion.PromotionCreateRequest;
import com.sba301.cinemaai.dto.response.promotion.PromotionResponse;
import com.sba301.cinemaai.dto.request.promotion.PromotionUpdateRequest;
import com.sba301.cinemaai.dto.request.promotion.ValidatePromotionRequest;
import com.sba301.cinemaai.dto.response.PageResponse;
import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.BookingPromotion;
import com.sba301.cinemaai.entity.Promotion;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.repository.BookingPromotionRepository;
import com.sba301.cinemaai.repository.BookingRepository;
import com.sba301.cinemaai.repository.PromotionRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private final PromotionRepository promotionRepository;
    private final BookingRepository bookingRepository;
    private final BookingPromotionRepository bookingPromotionRepository;

    @Transactional
    public ApplyPromotionResponse applyPromotion(Long bookingId, String code) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

        if (bookingPromotionRepository.existsByBookingId(bookingId)) {
            throw new BadRequestException("A promotion has already been applied to this booking");
        }

        Promotion promo = promotionRepository
                .findActiveByCode(code, LocalDateTime.now())
                .orElseThrow(() -> new NotFoundException("Promotion not found or inactive: " + code));

        validateUsageLimit(promo);
        validateMinOrder(promo, booking.getSubtotal());

        BigDecimal discount = calculateDiscount(promo, booking.getSubtotal());

        booking.updateAmounts(
                booking.getSubtotal(),
                discount,
                booking.getSubtotal().subtract(discount)
        );

        bookingPromotionRepository.save(new BookingPromotion(booking, promo, discount));
        promo.increaseUsage();

        return ApplyPromotionResponse.builder()
                .code(promo.getCode())
                .promotionName(promo.getName())
                .originalAmount(booking.getSubtotal())
                .discountAmount(discount)
                .finalAmount(booking.getTotalAmount())
                .message("Promotion applied successfully")
                .build();
    }

    @Transactional
    public void removePromotion(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found: " + bookingId));

        BookingPromotion bp = bookingPromotionRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new BadRequestException("No promotion applied to this booking"));

        bookingPromotionRepository.delete(bp);
        booking.clearPromotion();
    }

    @Transactional(readOnly = true)
    public PromotionResponse getByCode(String code) {
        Promotion promo = promotionRepository.findByCode(code)
                .orElseThrow(() -> new NotFoundException("Promotion not found: " + code));
        return PromotionResponse.from(promo);
    }

    @Transactional(readOnly = true)
    public ApplyPromotionResponse validatePromotion(ValidatePromotionRequest request) {
        Promotion promo = promotionRepository
                .findActiveByCode(request.getCode(), LocalDateTime.now())
                .orElseThrow(() -> new NotFoundException(
                        "Promotion not found or inactive: " + request.getCode()));

        validateUsageLimit(promo);
        validateMinOrder(promo, request.getOrderAmount());

        BigDecimal discount = calculateDiscount(promo, request.getOrderAmount());
        BigDecimal finalAmount = request.getOrderAmount().subtract(discount);

        return ApplyPromotionResponse.builder()
                .code(promo.getCode())
                .promotionName(promo.getName())
                .originalAmount(request.getOrderAmount())
                .discountAmount(discount)
                .finalAmount(finalAmount)
                .message("Promotion is valid")
                .build();
    }

    @Transactional
    public PromotionResponse create(PromotionCreateRequest request) {
        if (promotionRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Promotion code already exists: " + request.getCode());
        }
        if (request.getStartsAt().isAfter(request.getEndsAt())) {
            throw new BadRequestException("Start time must be before end time");
        }

        Promotion promo = new Promotion(
                request.getCode().toUpperCase(),
                request.getName(),
                request.getType(),
                request.getValue(),
                request.getStartsAt(),
                request.getEndsAt()
        );
        promo.updateMinOrder(request.getMinOrderAmount());
        promo.updateMaxDiscount(request.getMaxDiscountAmount());
        promo.updateUsageLimit(request.getUsageLimit());

        return PromotionResponse.from(promotionRepository.save(promo));
    }

    @Transactional
    public PromotionResponse update(Long id, PromotionUpdateRequest request) {
        Promotion promo = promotionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Promotion not found: " + id));

        if (request.getName() != null) promo.updateName(request.getName());
        if (request.getType() != null) promo.updateType(request.getType());
        if (request.getValue() != null) promo.updateValue(request.getValue());
        if (request.getMinOrderAmount() != null) promo.updateMinOrder(request.getMinOrderAmount());
        if (request.getMaxDiscountAmount() != null) promo.updateMaxDiscount(request.getMaxDiscountAmount());
        if (request.getUsageLimit() != null) promo.updateUsageLimit(request.getUsageLimit());
        if (request.getStatus() != null) promo.changeStatus(request.getStatus());

        if (request.getStartsAt() != null && request.getEndsAt() != null) {
            if (request.getStartsAt().isAfter(request.getEndsAt())) {
                throw new BadRequestException("Start time must be before end time");
            }
            promo.updateDates(request.getStartsAt(), request.getEndsAt());
        } else if (request.getStartsAt() != null) {
            promo.updateDates(request.getStartsAt(), promo.getEndsAt());
        } else if (request.getEndsAt() != null) {
            promo.updateDates(promo.getStartsAt(), request.getEndsAt());
        }

        return PromotionResponse.from(promotionRepository.save(promo));
    }

    @Transactional
    public void delete(Long id) {
        if (!promotionRepository.existsById(id)) {
            throw new NotFoundException("Promotion not found: " + id);
        }
        promotionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public PageResponse<PromotionResponse> listAll(int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(
                promotionRepository.findAll(pageable).map(PromotionResponse::from)
        );
    }

    private void validateUsageLimit(Promotion promo) {
        if (promo.getUsageLimit() != null && promo.getUsedCount() >= promo.getUsageLimit()) {
            throw new BadRequestException("Promotion usage limit has been reached");
        }
    }

    private void validateMinOrder(Promotion promo, BigDecimal subtotal) {
        if (promo.getMinOrderAmount() != null
                && subtotal.compareTo(promo.getMinOrderAmount()) < 0) {
            throw new BadRequestException(
                    "Order amount does not meet minimum required: " + promo.getMinOrderAmount().toPlainString());
        }
    }

    private BigDecimal calculateDiscount(Promotion promo, BigDecimal subtotal) {
        BigDecimal discount = promo.getType().calculate(subtotal, promo.getValue());
        if (promo.getMaxDiscountAmount() != null) {
            discount = discount.min(promo.getMaxDiscountAmount());
        }
        return discount.min(subtotal);
    }
}
