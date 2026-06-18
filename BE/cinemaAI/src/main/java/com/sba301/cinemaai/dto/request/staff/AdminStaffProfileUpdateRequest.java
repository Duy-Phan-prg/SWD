package com.sba301.cinemaai.dto.request.staff;

import com.sba301.cinemaai.enums.StaffStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminStaffProfileUpdateRequest(
        Long cinemaId,

        @NotBlank(message = "Employee code is required")
        @Size(max = 50, message = "Employee code must be at most 50 characters")
        String employeeCode,

        @NotBlank(message = "Position is required")
        @Size(max = 100, message = "Position must be at most 100 characters")
        String position,

        StaffStatus status
) {
}
