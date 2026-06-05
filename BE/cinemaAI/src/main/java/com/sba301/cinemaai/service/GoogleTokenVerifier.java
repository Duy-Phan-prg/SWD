package com.sba301.cinemaai.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.UnauthorizedException;
import com.sba301.cinemaai.security.GoogleAuthProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
@RequiredArgsConstructor
public class GoogleTokenVerifier {

    private final GoogleAuthProperties googleAuthProperties;
    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://oauth2.googleapis.com")
            .build();

    public GoogleTokenInfo verify(String credential) {
        String configuredClientId = googleAuthProperties.clientId() == null ? null : googleAuthProperties.clientId().trim();
        if (configuredClientId == null || configuredClientId.isBlank()) {
            throw new BadRequestException("Google client id is not configured");
        }

        GoogleTokenInfo tokenInfo;
        try {
            tokenInfo = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tokeninfo")
                            .queryParam("id_token", credential)
                            .build())
                    .retrieve()
                    .body(GoogleTokenInfo.class);
        } catch (RestClientResponseException exception) {
            throw new UnauthorizedException("Invalid Google credential: Google rejected the token");
        }

        if (tokenInfo == null
                || tokenInfo.email() == null
                || tokenInfo.email().isBlank()) {
            throw new UnauthorizedException("Invalid Google credential");
        }
        if (!configuredClientId.equals(tokenInfo.audience())) {
            throw new UnauthorizedException(
                    "Invalid Google credential: audience does not match configured client id"
                            + " (aud=" + tokenInfo.audience()
                            + ", configured=" + configuredClientId + ")"
            );
        }
        if (!Boolean.TRUE.equals(tokenInfo.emailVerified())) {
            throw new UnauthorizedException("Google email is not verified");
        }

        return tokenInfo;
    }

    public record GoogleTokenInfo(
            @JsonProperty("sub")
            String subject,

            @JsonProperty("aud")
            String audience,

            String email,

            @JsonProperty("email_verified")
            Boolean emailVerified,

            String name,

            @JsonProperty("given_name")
            String givenName,

            @JsonProperty("family_name")
            String familyName,

            String picture
    ) {
    }
}
