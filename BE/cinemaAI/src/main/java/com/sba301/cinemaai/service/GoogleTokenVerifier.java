package com.sba301.cinemaai.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.UnauthorizedException;
import com.sba301.cinemaai.security.GoogleAuthProperties;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GoogleTokenVerifier {

    private final GoogleAuthProperties googleAuthProperties;
    private final ObjectMapper objectMapper;

    public GoogleTokenInfo verify(String credential) {
        String configuredClientId = googleAuthProperties.clientId() == null ? null : googleAuthProperties.clientId().trim();
        if (configuredClientId == null || configuredClientId.isBlank()) {
            throw new BadRequestException("Google client id is not configured");
        }

        GoogleTokenInfo tokenInfo = decodeCredential(credential);

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

    private GoogleTokenInfo decodeCredential(String credential) {
        if (credential == null || credential.isBlank()) {
            throw new UnauthorizedException("Invalid Google credential");
        }

        String[] parts = credential.split("\\.");
        if (parts.length < 2) {
            throw new UnauthorizedException("Invalid Google credential");
        }

        try {
            byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
            Map<String, Object> claims = objectMapper.readValue(
                    new String(payloadBytes, StandardCharsets.UTF_8),
                    new TypeReference<>() {
                    }
            );

            long expiresAt = numberClaim(claims.get("exp"));
            if (expiresAt > 0 && Instant.now().getEpochSecond() >= expiresAt) {
                throw new UnauthorizedException("Invalid Google credential: token is expired");
            }

            return new GoogleTokenInfo(
                    stringClaim(claims.get("sub")),
                    stringClaim(claims.get("aud")),
                    stringClaim(claims.get("email")),
                    booleanClaim(claims.get("email_verified")),
                    stringClaim(claims.get("name")),
                    stringClaim(claims.get("given_name")),
                    stringClaim(claims.get("family_name")),
                    stringClaim(claims.get("picture"))
            );
        } catch (UnauthorizedException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new UnauthorizedException("Invalid Google credential");
        }
    }

    private String stringClaim(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Boolean booleanClaim(Object value) {
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        if (value instanceof String stringValue) {
            return Boolean.parseBoolean(stringValue);
        }
        return false;
    }

    private long numberClaim(Object value) {
        if (value instanceof Number numberValue) {
            return numberValue.longValue();
        }
        if (value instanceof String stringValue) {
            try {
                return Long.parseLong(stringValue);
            } catch (NumberFormatException exception) {
                return 0;
            }
        }
        return 0;
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
