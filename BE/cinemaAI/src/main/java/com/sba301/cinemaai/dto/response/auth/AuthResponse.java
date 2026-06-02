package com.sba301.cinemaai.dto.response.auth;

import com.sba301.cinemaai.dto.user.UserProfileResponse;
import java.util.List;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInMs,
        UserProfileResponse user,
        List<String> roles
) {
}
