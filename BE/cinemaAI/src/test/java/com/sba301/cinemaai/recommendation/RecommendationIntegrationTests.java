package com.sba301.cinemaai.recommendation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sba301.cinemaai.dto.request.auth.LoginRequest;
import com.sba301.cinemaai.dto.request.movie.ActorRequest;
import com.sba301.cinemaai.dto.request.movie.GenreRequest;
import com.sba301.cinemaai.dto.request.movie.MovieCreateRequest;
import com.sba301.cinemaai.dto.request.recommendation.TrailerInteractionRequest;
import com.sba301.cinemaai.entity.Role;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.UserRole;
import com.sba301.cinemaai.enums.MovieStatus;
import com.sba301.cinemaai.enums.RoleName;
import com.sba301.cinemaai.enums.TrailerInteractionType;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RecommendationIntegrationTests {

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
    void shouldRecommendNewMovieFromTrailerPreferenceAndFavoriteActor() throws Exception {
        String adminToken = loginWithRole(RoleName.ADMIN, "phase4.admin.");
        String customerToken = loginWithRole(RoleName.CUSTOMER, "phase4.customer.");

        Long actionGenreId = createGenre(adminToken, "Phase 4 Action");
        Long favoriteActorId = createActor(adminToken, "Favorite Star");
        Long sourceMovieId = createMovie(adminToken, "Phase 4 Action Source", actionGenreId, "Action Director", "Favorite Star", favoriteActorId);
        Long recommendedMovieId = createMovie(adminToken, "Phase 4 Action New Release", actionGenreId, "Action Director", "Favorite Star", favoriteActorId);

        mockMvc.perform(post("/api/v1/recommendations/trailer-interactions")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TrailerInteractionRequest(
                                sourceMovieId,
                                TrailerInteractionType.COMPLETE,
                                120,
                                120
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.movieId").value(sourceMovieId))
                .andExpect(jsonPath("$.data.interactionType").value("COMPLETE"));

        mockMvc.perform(get("/api/v1/recommendations/preferences/me")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.genreScores." + actionGenreId).exists());

        mockMvc.perform(get("/api/v1/recommendations/movies")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].movieId").value(recommendedMovieId))
                .andExpect(jsonPath("$.data[0].reasons[0]").exists());

        mockMvc.perform(get("/api/v1/recommendations/favorite-actors")
                        .header("Authorization", "Bearer " + customerToken)
                        .param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].actorName").value("Favorite Star"))
                .andExpect(jsonPath("$.data[0].movies[0].movieId").value(recommendedMovieId));
    }

    private Long createGenre(String token, String name) throws Exception {
        String description = "Recommendation integration test genre description with enough detail for validation. " +
                "This text intentionally explains the phase four preference scenario, where trailer completion, " +
                "favorite actors, directors and catalog metadata are aggregated into a stable user profile.";
        String response = mockMvc.perform(post("/api/v1/admin/genres")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new GenreRequest(name, description))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).at("/data/id").asLong();
    }

    private Long createMovie(String token, String title, Long genreId, String director, String actors, Long actorId) throws Exception {
        String response = mockMvc.perform(post("/api/v1/admin/movies")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new MovieCreateRequest(
                                title,
                                "Recommendation Original",
                                "A recommendation test movie.",
                                "https://example.com/trailer",
                                "https://example.com/poster.jpg",
                                "https://example.com/avatar.jpg",
                                110,
                                LocalDate.of(2026, 7, 1),
                                "English",
                                "Vietnamese",
                                MovieStatus.NOW_SHOWING,
                                "13+",
                                director,
                                List.of(genreId),
                                List.of(actorId),
                                List.of(actorId)
                        ))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).at("/data/id").asLong();
    }

    private Long createActor(String token, String name) throws Exception {
        String response = mockMvc.perform(post("/api/v1/admin/actors")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ActorRequest(
                                name,
                                "Created by recommendation integration test.",
                                "https://example.com/" + name.replace(" ", "-").toLowerCase() + ".jpg"
                        ))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).at("/data/id").asLong();
    }

    private String loginWithRole(RoleName roleName, String emailPrefix) throws Exception {
        String email = emailPrefix + System.nanoTime() + "@example.com";
        String password = "Password123";
        Role role = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(roleName)));

        User user = new User(email, passwordEncoder.encode(password), "Phase Four User", "0900555666");
        user.activateEmail();
        User savedUser = userRepository.save(user);
        userRoleRepository.save(new UserRole(savedUser, role));

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
