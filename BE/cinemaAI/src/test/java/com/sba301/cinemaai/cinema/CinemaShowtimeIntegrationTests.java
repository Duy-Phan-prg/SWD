package com.sba301.cinemaai.cinema;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sba301.cinemaai.dto.request.auth.LoginRequest;
import com.sba301.cinemaai.dto.request.cinema.CinemaRequest;
import com.sba301.cinemaai.dto.request.cinema.RoomRequest;
import com.sba301.cinemaai.dto.request.cinema.SeatGenerationRequest;
import com.sba301.cinemaai.dto.request.cinema.SeatUpdateRequest;
import com.sba301.cinemaai.dto.request.cinema.ShowtimeRequest;
import com.sba301.cinemaai.dto.request.ticket.TicketComboRequest;
import com.sba301.cinemaai.dto.request.ticket.TicketPriceValidationRequest;
import com.sba301.cinemaai.dto.request.ticket.TicketPricingRuleRequest;
import com.sba301.cinemaai.dto.request.ticket.TicketSelectionRequest;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.Role;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.UserRole;
import com.sba301.cinemaai.enums.CinemaStatus;
import com.sba301.cinemaai.enums.MovieStatus;
import com.sba301.cinemaai.enums.RoleName;
import com.sba301.cinemaai.enums.RoomStatus;
import com.sba301.cinemaai.enums.RoomType;
import com.sba301.cinemaai.enums.SeatStatus;
import com.sba301.cinemaai.enums.SeatType;
import com.sba301.cinemaai.enums.ShowtimeStatus;
import com.sba301.cinemaai.enums.TicketType;
import com.sba301.cinemaai.repository.MovieRepository;
import com.sba301.cinemaai.repository.RoleRepository;
import com.sba301.cinemaai.repository.UserRepository;
import com.sba301.cinemaai.repository.UserRoleRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
class CinemaShowtimeIntegrationTests {

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
    void shouldManageCinemaRoomsSeatsAndShowtimeConflictFlow() throws Exception {
        String token = loginAsAdmin();
        Movie movie = createMovie();

        Long cinemaId = createCinema(token);
        mockMvc.perform(post("/api/v1/admin/cinemas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CinemaRequest(
                                "Second Cinema " + System.nanoTime(),
                                "2 Phase Street",
                                "Ho Chi Minh City",
                                "0900555667",
                                CinemaStatus.ACTIVE
                        ))))
                .andExpect(status().isConflict());
        Long roomId = createRoom(token, cinemaId);

        String seatResponse = mockMvc.perform(post("/api/v1/admin/rooms/{roomId}/seats/generate", roomId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SeatGenerationRequest(SeatType.NORMAL, false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(12))
                .andExpect(jsonPath("$.data[0].rowLabel").value("A"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long seatId = objectMapper.readTree(seatResponse).at("/data/0/id").asLong();
        mockMvc.perform(put("/api/v1/admin/rooms/seats/{seatId}", seatId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new SeatUpdateRequest(
                                SeatType.VIP,
                                SeatStatus.MAINTENANCE
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.seatType").value("VIP"))
                .andExpect(jsonPath("$.data.status").value("MAINTENANCE"));

        mockMvc.perform(delete("/api/v1/admin/rooms/seats/{seatId}", seatId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("UNAVAILABLE"));

        LocalDateTime startTime = LocalDateTime.of(2026, 5, 20, 18, 0);
        String showtimeBody = objectMapper.writeValueAsString(new ShowtimeRequest(
                movie.getId(),
                roomId,
                startTime,
                BigDecimal.valueOf(95000),
                null,
                null,
                ShowtimeStatus.OPEN
        ));

        String showtimeResponse = mockMvc.perform(post("/api/v1/admin/showtimes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(showtimeBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.movieId").value(movie.getId()))
                .andExpect(jsonPath("$.data.roomId").value(roomId))
                .andExpect(jsonPath("$.data.status").value("OPEN"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Long showtimeId = objectMapper.readTree(showtimeResponse).at("/data/id").asLong();
        Long comboId = createTicketPricing(token);

        mockMvc.perform(post("/api/v1/ticket-pricing/validate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TicketPriceValidationRequest(
                                showtimeId,
                                comboId,
                                false,
                                List.of(new TicketSelectionRequest(TicketType.ADULT, 20, 1))
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.eligible").value(true))
                .andExpect(jsonPath("$.data.finalAmount").value(85000));

        mockMvc.perform(post("/api/v1/ticket-pricing/validate")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TicketPriceValidationRequest(
                                showtimeId,
                                null,
                                false,
                                List.of(new TicketSelectionRequest(TicketType.CHILD, 10, 1))
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.eligible").value(false))
                .andExpect(jsonPath("$.data.tickets[0].message").value("Viewer age does not meet movie age rating 13+"));

        mockMvc.perform(post("/api/v1/admin/showtimes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ShowtimeRequest(
                                movie.getId(),
                                roomId,
                                startTime.plusMinutes(30),
                                BigDecimal.valueOf(95000),
                                null,
                                null,
                                ShowtimeStatus.OPEN
                        ))))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/v1/showtimes")
                        .param("movieId", movie.getId().toString())
                        .param("date", "2026-05-20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(showtimeId));

        mockMvc.perform(get("/api/v1/showtimes/{showtimeId}/seat-map", showtimeId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rowCount").value(3))
                .andExpect(jsonPath("$.data.columnCount").value(4))
                .andExpect(jsonPath("$.data.seats.length()").value(12))
                .andExpect(jsonPath("$.data.seats[0].runtimeStatus").value("UNAVAILABLE"));

        Long customRoomId = createCustomRoom(token, cinemaId);
        mockMvc.perform(post("/api/v1/admin/rooms/{roomId}/seats/generate", customRoomId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "defaultSeatType", "STANDARD",
                                "overwriteExisting", true,
                                "rows", List.of(
                                        Map.of(
                                                "rowLabel", "A",
                                                "displayOrder", 1,
                                                "startColumn", 2,
                                                "seatType", "STANDARD",
                                                "seatNumbers", List.of(18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1)
                                        ),
                                        Map.of(
                                                "rowLabel", "D",
                                                "displayOrder", 4,
                                                "startColumn", 1,
                                                "seatType", "STANDARD",
                                                "seatNumbers", List.of(19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1)
                                        ),
                                        Map.of(
                                                "rowLabel", "O",
                                                "displayOrder", 14,
                                                "startColumn", 5,
                                                "seatType", "COUPLE",
                                                "seatNumbers", List.of(6, 5, 4, 3, 2, 1)
                                        )
                                )
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(43))
                .andExpect(jsonPath("$.data[0].rowLabel").value("A"))
                .andExpect(jsonPath("$.data[0].seatNumber").value(18))
                .andExpect(jsonPath("$.data[0].displayOrder").value(1))
                .andExpect(jsonPath("$.data[0].displayColumn").value(2))
                .andExpect(jsonPath("$.data[18].rowLabel").value("D"))
                .andExpect(jsonPath("$.data[18].startColumn").value(1))
                .andExpect(jsonPath("$.data[42].rowLabel").value("O"))
                .andExpect(jsonPath("$.data[42].seatType").value("COUPLE"));

        mockMvc.perform(patch("/api/v1/admin/showtimes/{showtimeId}/status", showtimeId)
                        .header("Authorization", "Bearer " + token)
                        .param("status", "CANCELLED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }

    private Long createCinema(String token) throws Exception {
        String response = mockMvc.perform(post("/api/v1/admin/cinema")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CinemaRequest(
                                "Phase 5 Cinema " + System.nanoTime(),
                                "1 Phase Street",
                                "Ho Chi Minh City",
                                "0900555666",
                                CinemaStatus.ACTIVE
                        ))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).at("/data/id").asLong();
    }

    private Long createRoom(String token) throws Exception {
        return createRoom(token, null);
    }

    private Long createRoom(String token, Long cinemaId) throws Exception {
        String response = mockMvc.perform(post("/api/v1/admin/rooms")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RoomRequest(
                                cinemaId,
                                "Room Phase 5",
                                RoomType.TWO_D,
                                3,
                                4,
                                RoomStatus.ACTIVE
                        ))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).at("/data/id").asLong();
    }

    private Long createCustomRoom(String token, Long cinemaId) throws Exception {
        String response = mockMvc.perform(post("/api/v1/admin/rooms")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new RoomRequest(
                                cinemaId,
                                "Room Custom Layout " + System.nanoTime(),
                                RoomType.TWO_D,
                                14,
                                19,
                                RoomStatus.ACTIVE
                        ))))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).at("/data/id").asLong();
    }

    private Long createTicketPricing(String token) throws Exception {
        mockMvc.perform(post("/api/v1/admin/ticket-pricing/rules")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TicketPricingRuleRequest(
                                TicketType.ADULT,
                                RoomType.TWO_D,
                                false,
                                false,
                                BigDecimal.valueOf(95000),
                                true
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.ticketType").value("ADULT"));

        String comboResponse = mockMvc.perform(post("/api/v1/admin/ticket-pricing/combos")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TicketComboRequest(
                                "Phase 5 Single Adult Combo " + System.nanoTime(),
                                "One adult ticket combo for validating Phase 5 pricing.",
                                1,
                                0,
                                0,
                                0,
                                BigDecimal.valueOf(85000),
                                true
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.adultCount").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(comboResponse).at("/data/id").asLong();
    }

    private Movie createMovie() {
        String title = "Phase 5 Movie " + System.nanoTime();
        Movie movie = new Movie(title, 110, MovieStatus.NOW_SHOWING);
        movie.updateDetails(title, "Scheduling test movie.", 110, LocalDate.of(2026, 5, 19));
        movie.updateMetadata("English", "Vietnamese", "13+", "Phase Five Director", "Phase Five Lead", "Cast");
        return movieRepository.save(movie);
    }

    private String loginAsAdmin() throws Exception {
        String email = "phase5.admin." + System.nanoTime() + "@example.com";
        String password = "Password123";
        Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ADMIN)));

        User admin = new User(email, passwordEncoder.encode(password), "Phase Five Admin", "0900555777");
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
