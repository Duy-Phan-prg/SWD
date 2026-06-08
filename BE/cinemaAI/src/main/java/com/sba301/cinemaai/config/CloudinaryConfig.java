package com.sba301.cinemaai.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class CloudinaryConfig {

    @Bean
    public CloudinaryCredentials cloudinaryCredentials(
            @Value("${cloudinary.url:${CLOUDINARY_URL:}}") String cloudinaryUrl,
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret
    ) {
        Map<String, String> localEnv = readLocalEnv();
        String resolvedUrl = firstText(localEnv.get("CLOUDINARY_URL"), cloudinaryUrl);
        CloudinaryCredentials credentials = parseCloudinaryUrl(resolvedUrl)
                .orElseGet(() -> new CloudinaryCredentials(
                        firstText(localEnv.get("CLOUDINARY_CLOUD_NAME"), cloudName),
                        firstText(localEnv.get("CLOUDINARY_API_KEY"), apiKey),
                        firstText(localEnv.get("CLOUDINARY_API_SECRET"), apiSecret)
                ));

        if (credentials.isConfigured()) {
            log.info("Cloudinary configured for cloud_name={} api_key={}",
                    credentials.cloudName(),
                    mask(credentials.apiKey()));
        } else {
            log.warn("Cloudinary is not fully configured");
        }
        return credentials;
    }

    @Bean
    public Cloudinary cloudinary(CloudinaryCredentials credentials) {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", credentials.cloudName(),
                "api_key", credentials.apiKey(),
                "api_secret", credentials.apiSecret(),
                "secure", true
        ));
    }

    private Map<String, String> readLocalEnv() {
        return envPath()
                .map(this::readEnvFile)
                .orElseGet(Map::of);
    }

    private Optional<Path> envPath() {
        return Optional.of(Path.of(System.getProperty("user.dir")))
                .flatMap(userDir -> possibleEnvPaths(userDir).stream()
                        .filter(Files::isRegularFile)
                        .findFirst());
    }

    private java.util.List<Path> possibleEnvPaths(Path userDir) {
        return java.util.List.of(
                userDir.resolve(".env"),
                userDir.resolve("cinemaAI/.env"),
                userDir.resolve("BE/cinemaAI/.env")
        );
    }

    private Map<String, String> readEnvFile(Path path) {
        try {
            return Files.readAllLines(path).stream()
                    .map(String::trim)
                    .filter(line -> !line.isBlank() && !line.startsWith("#"))
                    .filter(line -> line.contains("="))
                    .collect(java.util.stream.Collectors.toMap(
                            line -> line.substring(0, line.indexOf('=')).trim(),
                            line -> line.substring(line.indexOf('=') + 1).trim(),
                            (first, second) -> second
                    ));
        } catch (IOException exception) {
            log.warn("Could not read Cloudinary .env file at {}", path, exception);
            return Map.of();
        }
    }

    private Optional<CloudinaryCredentials> parseCloudinaryUrl(String cloudinaryUrl) {
        if (!hasText(cloudinaryUrl)) {
            return Optional.empty();
        }
        URI uri;
        try {
            uri = URI.create(cloudinaryUrl.trim());
        } catch (IllegalArgumentException exception) {
            return Optional.empty();
        }
        String userInfo = uri.getUserInfo();
        String host = uri.getHost();
        if (!"cloudinary".equalsIgnoreCase(uri.getScheme()) || !hasText(userInfo) || !hasText(host)) {
            return Optional.empty();
        }
        String[] parts = userInfo.split(":", 2);
        if (parts.length != 2) {
            return Optional.empty();
        }
        return Optional.of(new CloudinaryCredentials(
                host,
                decode(parts[0]),
                decode(parts[1])
        ));
    }

    private String firstText(String first, String second) {
        if (hasText(first)) {
            return first.trim();
        }
        if (hasText(second)) {
            return second.trim();
        }
        return "";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private String mask(String value) {
        if (!hasText(value) || value.length() <= 4) {
            return "****";
        }
        return "****" + value.substring(value.length() - 4);
    }
}
