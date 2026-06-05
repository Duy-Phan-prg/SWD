package com.sba301.cinemaai.dto.request.auth;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(
        @NotBlank(message = "Google credential is required")
        @JsonAlias({"idToken", "id_token", "token"})
        String credential
) {
}
