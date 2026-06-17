package com.sba301.cinemaai.dto.response.staff;

import com.sba301.cinemaai.enums.StaffStatus;
import java.time.LocalDateTime;

public record StaffProfileResponse(
        Long id,
        Long userId,
        String email,
        String fullName,
        String phone,
        Long cinemaId,
        String cinemaName,
        String employeeCode,
        String position,
        StaffStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
