package com.sba301.cinemaai.auth;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sba301.cinemaai.dto.request.auth.LoginRequest;
import com.sba301.cinemaai.dto.request.staff.AdminStaffProfileRequest;
import com.sba301.cinemaai.dto.request.staff.AdminStaffProfileUpdateRequest;
import com.sba301.cinemaai.dto.request.user.AdminStaffCreateRequest;
import com.sba301.cinemaai.entity.Cinema;
import com.sba301.cinemaai.enums.StaffStatus;
import com.sba301.cinemaai.repository.CinemaRepository;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AdminStaffIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CinemaRepository cinemaRepository;

    @Test
    void adminShouldCreateActiveStaffAccountThatCanLogin() throws Exception {
        String email = "staff-" + UUID.randomUUID() + "@example.com";
        String password = "StaffPassword123";
        AdminStaffCreateRequest request = new AdminStaffCreateRequest(
                email,
                password,
                "Cinema Staff",
                null,
                2000
        );

        mockMvc.perform(post("/api/v1/admin/users/staff")
                        .with(user("admin@example.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.emailVerified").value(true))
                .andExpect(jsonPath("$.data.roles[0]").value("STAFF"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.email").value(email))
                .andExpect(jsonPath("$.data.roles[0]").value("STAFF"));
    }

    @Test
    void nonAdminShouldNotCreateStaffAccount() throws Exception {
        AdminStaffCreateRequest request = new AdminStaffCreateRequest(
                "forbidden-" + UUID.randomUUID() + "@example.com",
                "StaffPassword123",
                "Forbidden Staff",
                null,
                2000
        );

        mockMvc.perform(post("/api/v1/admin/users/staff")
                        .with(user("customer@example.com").roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminShouldManageBasicStaffProfile() throws Exception {
        Cinema cinema = cinemaRepository.save(new Cinema(
                "Staff Cinema " + UUID.randomUUID(),
                "1 Staff Street",
                "HCMC",
                "0900123123"
        ));
        String email = "profile-staff-" + UUID.randomUUID() + "@example.com";
        AdminStaffCreateRequest createStaffRequest = new AdminStaffCreateRequest(
                email,
                "StaffPassword123",
                "Profile Staff",
                "0900555666",
                1999
        );

        String staffResponse = mockMvc.perform(post("/api/v1/admin/users/staff")
                        .with(user("admin@example.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createStaffRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        Long staffUserId = objectMapper.readTree(staffResponse).at("/data/id").asLong();

        AdminStaffProfileRequest createProfileRequest = new AdminStaffProfileRequest(
                staffUserId,
                cinema.getId(),
                "EMP-" + UUID.randomUUID().toString().substring(0, 8),
                "Gate Staff",
                StaffStatus.ACTIVE
        );

        String profileResponse = mockMvc.perform(post("/api/v1/admin/staff-profiles")
                        .with(user("admin@example.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createProfileRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId").value(staffUserId))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.position").value("Gate Staff"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andReturn()
                .getResponse()
                .getContentAsString();
        Long profileId = objectMapper.readTree(profileResponse).at("/data/id").asLong();

        mockMvc.perform(get("/api/v1/admin/staff-profiles")
                        .with(user("admin@example.com").roles("ADMIN"))
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].status").value("ACTIVE"));

        AdminStaffProfileUpdateRequest updateRequest = new AdminStaffProfileUpdateRequest(
                cinema.getId(),
                createProfileRequest.employeeCode() + "-A",
                "Senior Gate Staff",
                StaffStatus.ACTIVE
        );

        mockMvc.perform(put("/api/v1/admin/staff-profiles/{profileId}", profileId)
                        .with(user("admin@example.com").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.employeeCode").value(updateRequest.employeeCode()))
                .andExpect(jsonPath("$.data.position").value("Senior Gate Staff"));

        mockMvc.perform(patch("/api/v1/admin/staff-profiles/{profileId}/status", profileId)
                        .with(user("admin@example.com").roles("ADMIN"))
                        .param("status", "INACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("INACTIVE"));
    }
}
