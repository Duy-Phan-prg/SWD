package com.sba301.cinemaai.dto.response;

public record FieldErrorResponse(
        String field,
        String message
) {
}
