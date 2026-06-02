package com.sba301.cinemaai.dto.response.auth;

import com.sba301.cinemaai.dto.user.UserProfileResponse;

public record RegisterResponse(
        UserProfileResponse user,
        boolean emailVerificationRequired,
        long emailVerificationExpiresInSeconds
) {
}
