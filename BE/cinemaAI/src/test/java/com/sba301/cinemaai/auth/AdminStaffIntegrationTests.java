package com.sba301.cinemaai.auth;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sba301.cinemaai.dto.request.auth.LoginRequest;
import com.sba301.cinemaai.dto.request.user.AdminStaffCreateRequest;
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
}
