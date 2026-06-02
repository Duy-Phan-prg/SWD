package com.sba301.cinemaai.dto.response.loyalty;

import com.sba301.cinemaai.entity.LoyaltyPoint;
import com.sba301.cinemaai.enums.LoyaltyStatus;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class LoyaltyResponse {

    private Long userId;
    private String userEmail;
    private int points;
    private int totalPoints;
    private LoyaltyStatus status;

    public static LoyaltyResponse from(LoyaltyPoint lp) {
        return LoyaltyResponse.builder()
                .userId(lp.getUser().getId())
                .userEmail(lp.getUser().getEmail())
                .points(lp.getPoints())
                .totalPoints(lp.getTotalPoints())
                .status(lp.getStatus())
                .build();
    }
}
