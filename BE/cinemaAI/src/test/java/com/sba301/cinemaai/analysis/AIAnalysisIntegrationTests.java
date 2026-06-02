package com.sba301.cinemaai.analysis;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sba301.cinemaai.dto.request.auth.LoginRequest;
import com.sba301.cinemaai.dto.request.analysis.AIAnalysisDecisionRequest;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.Role;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.UserRole;
import com.sba301.cinemaai.enums.MovieStatus;
import com.sba301.cinemaai.enums.RoleName;
import com.sba301.cinemaai.repository.MovieRepository;
import com.sba301.cinemaai.repository.RoleRepository;
import com.sba301.cinemaai.repository.UserRepository;
import com.sba301.cinemaai.repository.UserRoleRepository;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AIAnalysisIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void shouldRequestRegenerateApproveRejectAndExposePublicAnalysis() throws Exception {
        String token = loginAsAdmin();
        Movie movie = createMovie();

        String analysisResponse = mockMvc.perform(post("/api/v1/admin/movies/{movieId}/analyses", movie.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.status").value("DONE"))
                .andExpect(jsonPath("$.data.contentLabel").value("ACTION"))
                .andExpect(jsonPath("$.data.emotionSegments[0].startMinute").value(0))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long analysisId = objectMapper.readTree(analysisResponse).at("/data/id").asLong();

        mockMvc.perform(get("/api/v1/movies/{movieId}/analysis", movie.getId()))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/admin/analyses/{analysisId}/regenerate", analysisId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DONE"))
                .andExpect(jsonPath("$.data.emotionSegments.length()").value(3));

        mockMvc.perform(post("/api/v1/admin/analyses/{analysisId}/approve", analysisId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AIAnalysisDecisionRequest("Looks good"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.decisionReason").value("Looks good"))
                .andExpect(jsonPath("$.data.approvedByUserId").isNumber());

        mockMvc.perform(get("/api/v1/movies/{movieId}/analysis", movie.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(analysisId))
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        mockMvc.perform(post("/api/v1/admin/analyses/{analysisId}/reject", analysisId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AIAnalysisDecisionRequest("Needs changes"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.decisionReason").value("Needs changes"));

        mockMvc.perform(get("/api/v1/movies/{movieId}/analysis", movie.getId()))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/v1/admin/analyses/{analysisId}", analysisId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/analyses/{analysisId}", analysisId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    private Movie createMovie() {
        String title = "Phase 4 Rescue Mission " + System.nanoTime();
        Movie movie = new Movie(title, 118, MovieStatus.NOW_SHOWING);
        movie.updateDetails(title, "A rescue mission crosses a dangerous frontier.", 118, LocalDate.of(2026, 5, 19));
        movie.updateMetadata("English", "Vietnamese", "13+", "Phase Four Director", "Lead One, Lead Two", "Lead One, Lead Two");
        return movieRepository.save(movie);
    }

    private String loginAsAdmin() throws Exception {
        String email = "phase4.admin." + System.nanoTime() + "@example.com";
        String password = "Password123";
        Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ADMIN)));

        User admin = new User(email, passwordEncoder.encode(password), "Phase Four Admin", "0900444555");
        admin.activateEmail();
        User savedAdmin = userRepository.save(admin);
        userRoleRepository.save(new UserRole(savedAdmin, adminRole));

        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode loginJson = objectMapper.readTree(response);
        return loginJson.at("/data/accessToken").asText();
    }
}
