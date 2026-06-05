package com.sba301.cinemaai.movie;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sba301.cinemaai.dto.request.auth.LoginRequest;
import com.sba301.cinemaai.dto.request.movie.GenreRequest;
import com.sba301.cinemaai.dto.request.movie.MovieCreateRequest;
import com.sba301.cinemaai.dto.request.movie.MovieStatusUpdateRequest;
import com.sba301.cinemaai.dto.request.movie.MovieUpdateRequest;
import com.sba301.cinemaai.entity.Role;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.UserRole;
import com.sba301.cinemaai.enums.MovieStatus;
import com.sba301.cinemaai.enums.RoleName;
import com.sba301.cinemaai.repository.RoleRepository;
import com.sba301.cinemaai.repository.UserRepository;
import com.sba301.cinemaai.repository.UserRoleRepository;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MovieIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void shouldManageGenresAndMoviesThroughAdminAndPublicApis() throws Exception {
        String token = loginAsAdmin();

        Long genreId = createGenre(token, "Phase 3 Adventure");

        String createMovieResponse = mockMvc.perform(post("/api/v1/admin/movies")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new MovieCreateRequest(
                                "Phase 3 Orbit",
                                "A testable movie catalog entry.",
                                "https://example.com/trailer",
                                "https://example.com/poster.jpg",
                                "https://example.com/avatar.jpg",
                                121,
                                LocalDate.of(2026, 5, 19),
                                "English",
                                "Vietnamese",
                                MovieStatus.UPCOMING,
                                "13+",
                                "Test Director",
                                "Actor One",
                                "Actor One, Actor Two",
                                List.of(genreId)
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Phase 3 Orbit"))
                .andExpect(jsonPath("$.data.genres[0].id").value(genreId))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long movieId = objectMapper.readTree(createMovieResponse).at("/data/id").asLong();

        mockMvc.perform(get("/api/v1/movies")
                        .param("keyword", "Orbit")
                        .param("genreId", genreId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].title").value("Phase 3 Orbit"));

        mockMvc.perform(get("/api/v1/movies/{movieId}", movieId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(movieId))
                .andExpect(jsonPath("$.data.status").value("UPCOMING"));

        mockMvc.perform(put("/api/v1/admin/movies/{movieId}", movieId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new MovieUpdateRequest(
                                "Phase 3 Orbit Updated",
                                "Updated movie catalog entry.",
                                "https://example.com/trailer-2",
                                "https://example.com/poster-2.jpg",
                                "https://example.com/avatar-2.jpg",
                                125,
                                LocalDate.of(2026, 6, 1),
                                "English",
                                "Vietnamese",
                                MovieStatus.UPCOMING,
                                "16+",
                                "Updated Director",
                                "Actor Three",
                                "Actor Three",
                                List.of(genreId)
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Phase 3 Orbit Updated"))
                .andExpect(jsonPath("$.data.status").value("UPCOMING"))
                .andExpect(jsonPath("$.data.avatarUrl").value("https://example.com/avatar-2.jpg"))
                .andExpect(jsonPath("$.data.mainActors").value("Actor Three"));

        mockMvc.perform(patch("/api/v1/admin/movies/{movieId}/status", movieId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new MovieStatusUpdateRequest(MovieStatus.NOW_SHOWING))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("NOW_SHOWING"));

        mockMvc.perform(put("/api/v1/admin/movies/{movieId}", movieId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new MovieUpdateRequest(
                                "Blocked Update",
                                "Should not update now showing movie.",
                                "https://example.com/trailer-3",
                                "https://example.com/poster-3.jpg",
                                "https://example.com/avatar-3.jpg",
                                126,
                                LocalDate.of(2026, 6, 2),
                                "English",
                                "Vietnamese",
                                MovieStatus.UPCOMING,
                                "16+",
                                "Blocked Director",
                                "Blocked Actor",
                                "Blocked Actor",
                                List.of(genreId)
                        ))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(patch("/api/v1/admin/movies/{movieId}/status", movieId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new MovieStatusUpdateRequest(MovieStatus.INACTIVE))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("INACTIVE"));

        mockMvc.perform(get("/api/v1/movies/{movieId}", movieId))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/v1/admin/movies/{movieId}", movieId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    private Long createGenre(String token, String name) throws Exception {
        String description = "Created by integration test. This genre description is intentionally long enough to satisfy " +
                "the administrator validation rule for detailed catalog metadata before the genre payload is accepted. " +
                "It also mirrors real editorial notes used by the cinema admin console.";

        String response = mockMvc.perform(post("/api/v1/admin/genres")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GenreRequest(name, description))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value(name))
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).at("/data/id").asLong();
    }

    private String loginAsAdmin() throws Exception {
        String email = "phase3.admin." + System.nanoTime() + "@example.com";
        String password = "Password123";
        Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ADMIN)));

        User admin = new User(email, passwordEncoder.encode(password), "Phase Three Admin", "0900333444");
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
