package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.request.booking.CheckInRequest;
import com.sba301.cinemaai.dto.request.booking.RefundRequest;
import com.sba301.cinemaai.dto.request.cinema.BulkShowtimeRequest;
import com.sba301.cinemaai.dto.request.cinema.CinemaRequest;
import com.sba301.cinemaai.dto.request.cinema.RoomRequest;
import com.sba301.cinemaai.dto.request.cinema.SeatLayoutRequest;
import com.sba301.cinemaai.dto.request.cinema.SeatUpdateRequest;
import com.sba301.cinemaai.dto.request.cinema.ShowtimeRequest;
import com.sba301.cinemaai.dto.request.food.FoodComboRequest;
import com.sba301.cinemaai.dto.request.food.FoodItemRequest;
import com.sba301.cinemaai.dto.request.loyalty.LoyaltyAddRequest;
import com.sba301.cinemaai.dto.request.movie.ActorRequest;
import com.sba301.cinemaai.dto.request.movie.GenreRequest;
import com.sba301.cinemaai.dto.request.movie.MovieCreateRequest;
import com.sba301.cinemaai.dto.request.movie.MovieStatusUpdateRequest;
import com.sba301.cinemaai.dto.request.movie.MovieUpdateRequest;
import com.sba301.cinemaai.dto.request.ticket.TicketComboRequest;
import com.sba301.cinemaai.dto.request.ticket.TicketPricingRuleRequest;
import com.sba301.cinemaai.dto.request.user.AdminStaffCreateRequest;
import com.sba301.cinemaai.dto.request.user.AdminUserStatusUpdateRequest;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.dto.response.PageResponse;
import com.sba301.cinemaai.dto.response.booking.BookingResponse;
import com.sba301.cinemaai.dto.response.cinema.CinemaResponse;
import com.sba301.cinemaai.dto.response.cinema.RoomResponse;
import com.sba301.cinemaai.dto.response.cinema.SeatResponse;
import com.sba301.cinemaai.dto.response.cinema.ShowtimeResponse;
import com.sba301.cinemaai.dto.response.cinema.ShowtimeSeatMapResponse;
import com.sba301.cinemaai.dto.response.food.FoodComboResponse;
import com.sba301.cinemaai.dto.response.food.FoodItemResponse;
import com.sba301.cinemaai.dto.response.loyalty.LoyaltyResponse;
import com.sba301.cinemaai.dto.response.movie.ActorResponse;
import com.sba301.cinemaai.dto.response.movie.GenreResponse;
import com.sba301.cinemaai.dto.response.movie.MovieResponse;
import com.sba301.cinemaai.dto.response.recommendation.RecommendationDebugResponse;
import com.sba301.cinemaai.dto.response.report.RevenueReportResponse;
import com.sba301.cinemaai.dto.response.report.RoomOccupancyResponse;
import com.sba301.cinemaai.dto.response.report.TopMovieResponse;
import com.sba301.cinemaai.dto.response.review.ReviewResponse;
import com.sba301.cinemaai.dto.response.upload.UploadedFileResponse;
import com.sba301.cinemaai.dto.response.user.UserProfileResponse;
import com.sba301.cinemaai.enums.BookingStatus;
import com.sba301.cinemaai.enums.CinemaStatus;
import com.sba301.cinemaai.enums.MovieStatus;
import com.sba301.cinemaai.enums.RoomStatus;
import com.sba301.cinemaai.enums.RoomType;
import com.sba301.cinemaai.enums.SeatType;
import com.sba301.cinemaai.enums.ShowtimeStatus;
import com.sba301.cinemaai.enums.TicketType;
import com.sba301.cinemaai.security.AuthenticatedUser;
import com.sba301.cinemaai.service.ActorService;
import com.sba301.cinemaai.service.BookingService;
import com.sba301.cinemaai.service.CinemaService;
import com.sba301.cinemaai.service.CloudinaryUploadService;
import com.sba301.cinemaai.service.FoodService;
import com.sba301.cinemaai.service.GenreService;
import com.sba301.cinemaai.service.LoyaltyPointService;
import com.sba301.cinemaai.service.MovieService;
import com.sba301.cinemaai.service.RecommendationService;
import com.sba301.cinemaai.service.ReportService;
import com.sba301.cinemaai.service.ReviewService;
import com.sba301.cinemaai.service.RoomService;
import com.sba301.cinemaai.service.ShowtimeService;
import com.sba301.cinemaai.service.TicketPricingService;
import com.sba301.cinemaai.service.UserService;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Single consolidated controller for all ADMIN endpoints (/api/v1/admin/**).
 * Grouped by domain. All endpoints require the ADMIN role.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin", description = "All admin operations - requires ADMIN role")
public class AdminController {

    private final ActorService actorService;
    private final GenreService genreService;
    private final MovieService movieService;
    private final FoodService foodService;
    private final UserService userService;
    private final LoyaltyPointService loyaltyPointService;
    private final RecommendationService recommendationService;
    private final CloudinaryUploadService cloudinaryUploadService;
    private final CinemaService cinemaService;
    private final RoomService roomService;
    private final ShowtimeService showtimeService;
    private final TicketPricingService ticketPricingService;
    private final BookingService bookingService;
    private final ReviewService reviewService;
    private final ReportService reportService;

    // =========================================================================
    // ACTORS  —  /api/v1/admin/actors
    // List/search · create · update · delete
    // =========================================================================

    @GetMapping("/actors")
    @Operation(summary = "List or search actors (Admin)")
    public ApiResponse<PageResponse<ActorResponse>> getActors(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(actorService.searchAdminActors(keyword, page, size));
    }

    @PostMapping("/actors")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create actor (Admin)")
    public ApiResponse<ActorResponse> createActor(@Valid @RequestBody ActorRequest request) {
        return ApiResponse.success(actorService.create(request), "Actor created successfully");
    }

    @PutMapping("/actors/{actorId}")
    @Operation(summary = "Update actor (Admin)")
    public ApiResponse<ActorResponse> updateActor(
            @PathVariable Long actorId,
            @Valid @RequestBody ActorRequest request
    ) {
        return ApiResponse.success(actorService.update(actorId, request), "Actor updated successfully");
    }

    @DeleteMapping("/actors/{actorId}")
    @Operation(summary = "Delete actor (Admin)")
    public ApiResponse<Void> deleteActor(@PathVariable Long actorId) {
        actorService.delete(actorId);
        return ApiResponse.success(null, "Actor deleted successfully");
    }

    // =========================================================================
    // GENRES  —  /api/v1/admin/genres
    // Create · update · delete
    // =========================================================================

    @PostMapping("/genres")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new genre (Admin)")
    public ApiResponse<GenreResponse> createGenre(@Valid @RequestBody GenreRequest request) {
        return ApiResponse.success(genreService.create(request), "Genre created successfully");
    }

    @PutMapping("/genres/{genreId}")
    @Operation(summary = "Update genre (Admin)")
    public ApiResponse<GenreResponse> updateGenre(
            @PathVariable Long genreId,
            @Valid @RequestBody GenreRequest request
    ) {
        return ApiResponse.success(genreService.update(genreId, request), "Genre updated successfully");
    }

    @DeleteMapping("/genres/{genreId}")
    @Operation(summary = "Delete genre (Admin)")
    public ApiResponse<Void> deleteGenre(@PathVariable Long genreId) {
        genreService.delete(genreId);
        return ApiResponse.success(null, "Genre deleted successfully");
    }

    // =========================================================================
    // MOVIES  —  /api/v1/admin/movies
    // Search · get detail · create · update · update status · delete
    // =========================================================================

    @GetMapping("/movies")
    @Operation(summary = "Search movies (Admin)")
    public ApiResponse<PageResponse<MovieResponse>> searchMovies(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) MovieStatus status,
            @RequestParam(required = false) Long genreId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(movieService.searchAdmin(keyword, status, genreId, fromDate, toDate, page, size));
    }

    @GetMapping("/movies/{movieId}")
    @Operation(summary = "Get movie details (Admin)")
    public ApiResponse<MovieResponse> getMovie(@PathVariable Long movieId) {
        return ApiResponse.success(movieService.getAdmin(movieId));
    }

    @PostMapping("/movies")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new movie (Admin)")
    public ApiResponse<MovieResponse> createMovie(@Valid @RequestBody MovieCreateRequest request) {
        return ApiResponse.success(movieService.create(request), "Movie created successfully");
    }

    @PutMapping("/movies/{movieId}")
    @Operation(summary = "Update movie (Admin)")
    public ApiResponse<MovieResponse> updateMovie(
            @PathVariable Long movieId,
            @Valid @RequestBody MovieUpdateRequest request
    ) {
        return ApiResponse.success(movieService.update(movieId, request), "Movie updated successfully");
    }

    @PatchMapping("/movies/{movieId}/status")
    @Operation(summary = "Update movie status (Admin)")
    public ApiResponse<MovieResponse> updateMovieStatus(
            @PathVariable Long movieId,
            @Valid @RequestBody MovieStatusUpdateRequest request
    ) {
        return ApiResponse.success(movieService.updateStatus(movieId, request), "Movie status updated successfully");
    }

    @DeleteMapping("/movies/{movieId}")
    @Operation(summary = "Delete movie (Admin)")
    public ApiResponse<Void> deleteMovie(@PathVariable Long movieId) {
        movieService.delete(movieId);
        return ApiResponse.success(null, "Movie deleted successfully");
    }

    // =========================================================================
    // CINEMA  —  /api/v1/admin/cinema  (single cinema)
    // Get · create · update · update status · deactivate
    // =========================================================================

    @GetMapping("/cinema")
    @Operation(summary = "Get configured cinema")
    public ApiResponse<CinemaResponse> getCinema() {
        return ApiResponse.success(cinemaService.getAdminCinema());
    }

    @PostMapping("/cinema")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create configured cinema (Admin)")
    public ApiResponse<CinemaResponse> createCinema(@Valid @RequestBody CinemaRequest request) {
        return ApiResponse.success(cinemaService.create(request), "Cinema saved successfully");
    }

    @PutMapping("/cinema")
    @Operation(summary = "Update configured cinema (Admin)")
    public ApiResponse<CinemaResponse> updateCinema(@Valid @RequestBody CinemaRequest request) {
        return ApiResponse.success(cinemaService.update(request), "Cinema updated successfully");
    }

    @PatchMapping("/cinema/status")
    @Operation(summary = "Update configured cinema status (Admin)")
    public ApiResponse<CinemaResponse> updateCinemaStatus(@RequestParam CinemaStatus status) {
        return ApiResponse.success(cinemaService.updateStatus(status), "Cinema status updated successfully");
    }

    @DeleteMapping("/cinema")
    @Operation(summary = "Deactivate configured cinema (Admin)")
    public ApiResponse<Void> deleteCinema() {
        cinemaService.delete();
        return ApiResponse.success(null, "Cinema deactivated successfully");
    }

    // =========================================================================
    // ROOMS & SEATS  —  /api/v1/admin/rooms
    // Rooms CRUD + status · seat layout generate/replace · single seat update/delete
    // =========================================================================

    @GetMapping("/rooms")
    @Operation(summary = "Get configured cinema rooms (Admin)")
    public ApiResponse<List<RoomResponse>> getRooms() {
        return ApiResponse.success(roomService.getRooms());
    }

    @GetMapping("/rooms/{roomId}")
    @Operation(summary = "Get room by ID (Admin)")
    public ApiResponse<RoomResponse> getRoom(@PathVariable Long roomId) {
        return ApiResponse.success(roomService.getRoom(roomId));
    }

    @GetMapping("/rooms/{roomId}/seats")
    @Operation(summary = "Get room seats (Admin)")
    public ApiResponse<List<SeatResponse>> getSeats(@PathVariable Long roomId) {
        return ApiResponse.success(roomService.getSeats(roomId));
    }

    @GetMapping("/rooms/seats/{seatId}")
    @Operation(summary = "Get seat by ID (Admin)")
    public ApiResponse<SeatResponse> getSeat(@PathVariable Long seatId) {
        return ApiResponse.success(roomService.getSeat(seatId));
    }

    @PostMapping("/rooms")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new room (Admin)")
    public ApiResponse<RoomResponse> createRoom(@Valid @RequestBody RoomRequest request) {
        return ApiResponse.success(roomService.create(request), "Room created successfully");
    }

    @PutMapping("/rooms/{roomId}")
    @Operation(summary = "Update room (Admin)")
    public ApiResponse<RoomResponse> updateRoom(
            @PathVariable Long roomId,
            @Valid @RequestBody RoomRequest request
    ) {
        return ApiResponse.success(roomService.update(roomId, request), "Room updated successfully");
    }

    @PatchMapping("/rooms/{roomId}/status")
    @Operation(summary = "Update room status (Admin)")
    public ApiResponse<RoomResponse> updateRoomStatus(
            @PathVariable Long roomId,
            @RequestParam RoomStatus status
    ) {
        return ApiResponse.success(roomService.updateStatus(roomId, status), "Room status updated successfully");
    }

    @PostMapping("/rooms/{roomId}/seats/generate")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create room seat layout (Admin)")
    public ApiResponse<List<SeatResponse>> createSeats(
            @PathVariable Long roomId,
            @Valid @RequestBody SeatLayoutRequest request
    ) {
        return ApiResponse.success(roomService.createSeats(roomId, request), "Seats created successfully");
    }

    @PutMapping("/rooms/{roomId}/seats")
    @Operation(summary = "Replace room seat layout (Admin)")
    public ApiResponse<List<SeatResponse>> replaceSeats(
            @PathVariable Long roomId,
            @Valid @RequestBody SeatLayoutRequest request
    ) {
        return ApiResponse.success(roomService.replaceSeats(roomId, request), "Seat layout replaced successfully");
    }

    @PutMapping("/rooms/seats/{seatId}")
    @Operation(summary = "Update seat (Admin)")
    public ApiResponse<SeatResponse> updateSeat(
            @PathVariable Long seatId,
            @Valid @RequestBody SeatUpdateRequest request
    ) {
        return ApiResponse.success(roomService.updateSeat(seatId, request), "Seat updated successfully");
    }

    @DeleteMapping("/rooms/seats/{seatId}")
    @Operation(summary = "Delete seat (Admin)")
    public ApiResponse<SeatResponse> deleteSeat(@PathVariable Long seatId) {
        return ApiResponse.success(roomService.deleteSeat(seatId), "Seat deleted successfully");
    }

    // =========================================================================
    // SHOWTIMES  —  /api/v1/admin/showtimes
    // Search · detail · seat-map · create · bulk create · update · status/cancel · delete
    // =========================================================================

    @GetMapping("/showtimes")
    @Operation(summary = "Search showtimes with paging (Admin)")
    public ApiResponse<PageResponse<ShowtimeResponse>> searchShowtimes(
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) Long cinemaId,
            @RequestParam(required = false) ShowtimeStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(showtimeService.searchAdmin(movieId, roomId, cinemaId, status, date, page, size));
    }

    @GetMapping("/showtimes/{showtimeId}")
    @Operation(summary = "Get showtime by ID (Admin)")
    public ApiResponse<ShowtimeResponse> getShowtime(@PathVariable Long showtimeId) {
        return ApiResponse.success(showtimeService.getAdmin(showtimeId));
    }

    @GetMapping("/showtimes/{showtimeId}/seat-map")
    @Operation(summary = "Get showtime seat map (Admin)")
    public ApiResponse<ShowtimeSeatMapResponse> getShowtimeSeatMap(@PathVariable Long showtimeId) {
        return ApiResponse.success(showtimeService.getSeatMap(showtimeId));
    }

    @PostMapping("/showtimes")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create new showtime (Admin)")
    public ApiResponse<ShowtimeResponse> createShowtime(@Valid @RequestBody ShowtimeRequest request) {
        return ApiResponse.success(showtimeService.create(request), "Showtime created successfully");
    }

    @PostMapping("/showtimes/bulk")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Bulk create showtimes for one movie (Admin)")
    public ApiResponse<List<ShowtimeResponse>> createBulkShowtimes(@Valid @RequestBody BulkShowtimeRequest request) {
        return ApiResponse.success(showtimeService.createBulk(request),
                request.slots().size() + " showtime(s) created successfully");
    }

    @PutMapping("/showtimes/{showtimeId}")
    @Operation(summary = "Update showtime (Admin)")
    public ApiResponse<ShowtimeResponse> updateShowtime(
            @PathVariable Long showtimeId,
            @Valid @RequestBody ShowtimeRequest request
    ) {
        return ApiResponse.success(showtimeService.update(showtimeId, request), "Showtime updated successfully");
    }

    @PatchMapping("/showtimes/{showtimeId}/status")
    @Operation(summary = "Update showtime status / cancel (Admin)")
    public ApiResponse<ShowtimeResponse> updateShowtimeStatus(
            @PathVariable Long showtimeId,
            @RequestParam ShowtimeStatus status
    ) {
        return ApiResponse.success(showtimeService.updateStatus(showtimeId, status), "Showtime status updated successfully");
    }

    @DeleteMapping("/showtimes/{showtimeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete showtime (Admin)")
    public void deleteShowtime(@PathVariable Long showtimeId) {
        showtimeService.delete(showtimeId);
    }

    // =========================================================================
    // FOOD & COMBO  —  /api/v1/admin/foods
    // Food items & combos: list · create · update · delete
    // =========================================================================

    @GetMapping("/foods/items")
    @Operation(summary = "Get all food items (Admin)")
    public ApiResponse<PageResponse<FoodItemResponse>> getFoodItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(foodService.getAllItems(page, size));
    }

    @GetMapping("/foods/combos")
    @Operation(summary = "Get all food combos (Admin)")
    public ApiResponse<PageResponse<FoodComboResponse>> getFoodCombos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(foodService.getAllCombos(page, size));
    }

    @PostMapping("/foods/items")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create food item (Admin)")
    public ApiResponse<FoodItemResponse> createFoodItem(@Valid @RequestBody FoodItemRequest request) {
        return ApiResponse.success(foodService.createItem(request), "Food item created successfully");
    }

    @PostMapping("/foods/combos")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create food combo (Admin)")
    public ApiResponse<FoodComboResponse> createFoodCombo(@Valid @RequestBody FoodComboRequest request) {
        return ApiResponse.success(foodService.createCombo(request), "Food combo created successfully");
    }

    @PutMapping("/foods/items/{itemId}")
    @Operation(summary = "Update food item (Admin)")
    public ApiResponse<FoodItemResponse> updateFoodItem(
            @PathVariable Long itemId,
            @Valid @RequestBody FoodItemRequest request
    ) {
        return ApiResponse.success(foodService.updateItem(itemId, request), "Food item updated successfully");
    }

    @PutMapping("/foods/combos/{comboId}")
    @Operation(summary = "Update food combo (Admin)")
    public ApiResponse<FoodComboResponse> updateFoodCombo(
            @PathVariable Long comboId,
            @Valid @RequestBody FoodComboRequest request
    ) {
        return ApiResponse.success(foodService.updateCombo(comboId, request), "Food combo updated successfully");
    }

    @DeleteMapping("/foods/items/{itemId}")
    @Operation(summary = "Delete food item (Admin)")
    public ApiResponse<FoodItemResponse> deleteFoodItem(@PathVariable Long itemId) {
        return ApiResponse.success(foodService.deleteItem(itemId), "Food item deleted successfully");
    }

    @DeleteMapping("/foods/combos/{comboId}")
    @Operation(summary = "Delete food combo (Admin)")
    public ApiResponse<FoodComboResponse> deleteFoodCombo(@PathVariable Long comboId) {
        return ApiResponse.success(foodService.deleteCombo(comboId), "Food combo deleted successfully");
    }

    // =========================================================================
    // TICKET PRICING  —  /api/v1/admin/ticket-pricing  (hidden from Swagger)
    // Pricing rules CRUD · ticket combos CRUD
    // =========================================================================

    @Hidden
    @GetMapping("/ticket-pricing/rules")
    public ApiResponse<PageResponse<com.sba301.cinemaai.dto.response.ticket.TicketPricingRuleResponse>> getRules(
            @RequestParam(required = false) TicketType ticketType,
            @RequestParam(required = false) RoomType roomType,
            @RequestParam(required = false) SeatType seatType,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(ticketPricingService.searchRules(ticketType, roomType, seatType, active, page, size));
    }

    @Hidden
    @PostMapping("/ticket-pricing/rules")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<com.sba301.cinemaai.dto.response.ticket.TicketPricingRuleResponse> createRule(
            @Valid @RequestBody TicketPricingRuleRequest request) {
        return ApiResponse.success(ticketPricingService.createRule(request), "Ticket pricing rule created successfully");
    }

    @Hidden
    @PutMapping("/ticket-pricing/rules/{ruleId}")
    public ApiResponse<com.sba301.cinemaai.dto.response.ticket.TicketPricingRuleResponse> updateRule(
            @PathVariable Long ruleId,
            @Valid @RequestBody TicketPricingRuleRequest request
    ) {
        return ApiResponse.success(ticketPricingService.updateRule(ruleId, request), "Ticket pricing rule updated successfully");
    }

    @Hidden
    @DeleteMapping("/ticket-pricing/rules/{ruleId}")
    public ApiResponse<Void> deleteRule(@PathVariable Long ruleId) {
        ticketPricingService.deleteRule(ruleId);
        return ApiResponse.success(null, "Ticket pricing rule deleted successfully");
    }

    @Hidden
    @GetMapping("/ticket-pricing/combos")
    public ApiResponse<PageResponse<com.sba301.cinemaai.dto.response.ticket.TicketComboResponse>> getTicketCombos(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(ticketPricingService.searchCombos(active, keyword, page, size));
    }

    @Hidden
    @PostMapping("/ticket-pricing/combos")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<com.sba301.cinemaai.dto.response.ticket.TicketComboResponse> createTicketCombo(
            @Valid @RequestBody TicketComboRequest request) {
        return ApiResponse.success(ticketPricingService.createCombo(request), "Ticket combo created successfully");
    }

    @Hidden
    @PutMapping("/ticket-pricing/combos/{comboId}")
    public ApiResponse<com.sba301.cinemaai.dto.response.ticket.TicketComboResponse> updateTicketCombo(
            @PathVariable Long comboId,
            @Valid @RequestBody TicketComboRequest request
    ) {
        return ApiResponse.success(ticketPricingService.updateCombo(comboId, request), "Ticket combo updated successfully");
    }

    @Hidden
    @DeleteMapping("/ticket-pricing/combos/{comboId}")
    public ApiResponse<Void> deleteTicketCombo(@PathVariable Long comboId) {
        ticketPricingService.deleteCombo(comboId);
        return ApiResponse.success(null, "Ticket combo deleted successfully");
    }

    // =========================================================================
    // BOOKINGS  —  /api/v1/admin/bookings
    // List · detail · cancel · check-in · refund-request · mark-refunded
    // =========================================================================

    @GetMapping("/bookings")
    @Operation(summary = "List bookings (Admin)")
    public ApiResponse<PageResponse<BookingResponse>> getBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(bookingService.getAdminBookings(status, page, size));
    }

    @GetMapping("/bookings/{bookingId}")
    @Operation(summary = "Get booking detail (Admin)")
    public ApiResponse<BookingResponse> getBooking(@PathVariable Long bookingId) {
        return ApiResponse.success(bookingService.getAdminBooking(bookingId));
    }

    @DeleteMapping("/bookings/{bookingId}")
    @Operation(summary = "Cancel booking (Admin)")
    public ApiResponse<BookingResponse> cancelBooking(@PathVariable Long bookingId) {
        return ApiResponse.success(bookingService.cancelAdmin(bookingId), "Booking cancelled successfully");
    }

    @PostMapping("/bookings/{bookingId}/check-in")
    @Operation(summary = "Check in booking (Admin)")
    public ApiResponse<BookingResponse> checkInBooking(
            @PathVariable Long bookingId,
            @Valid @RequestBody(required = false) CheckInRequest request
    ) {
        String qrCode = request == null ? null : request.qrCode();
        return ApiResponse.success(bookingService.checkInAdmin(bookingId, qrCode), "Booking checked in successfully");
    }

    @PostMapping("/bookings/{bookingId}/refund-request")
    @Operation(summary = "Request refund for booking (Admin)")
    public ApiResponse<BookingResponse> requestBookingRefund(
            @PathVariable Long bookingId,
            @Valid @RequestBody RefundRequest request
    ) {
        return ApiResponse.success(
                bookingService.requestRefundAdmin(bookingId, request.reason()),
                "Refund requested successfully"
        );
    }

    @PostMapping("/bookings/{bookingId}/mark-refunded")
    @Operation(summary = "Mark booking as refunded (Admin)")
    public ApiResponse<BookingResponse> markBookingRefunded(@PathVariable Long bookingId) {
        return ApiResponse.success(bookingService.markRefunded(bookingId), "Booking marked as refunded successfully");
    }

    // =========================================================================
    // USERS  —  /api/v1/admin/users
    // List · detail · create staff account · update account status
    // =========================================================================

    @GetMapping("/users")
    @Operation(summary = "Get all users (Admin)")
    public ApiResponse<List<UserProfileResponse>> getUsers() {
        return ApiResponse.success(userService.getAllUsers());
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Get user by ID (Admin)")
    public ApiResponse<UserProfileResponse> getUser(@PathVariable Long userId) {
        return ApiResponse.success(userService.getById(userId));
    }

    @PostMapping("/users/staff")
    @Operation(summary = "Create staff account (Admin)")
    public ApiResponse<UserProfileResponse> createStaff(@Valid @RequestBody AdminStaffCreateRequest request) {
        return ApiResponse.success(userService.createStaff(request), "Staff account created successfully");
    }

    @PatchMapping("/users/{userId}/status")
    @Operation(summary = "Update user status (Admin)")
    public ApiResponse<UserProfileResponse> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody AdminUserStatusUpdateRequest request
    ) {
        return ApiResponse.success(userService.updateStatus(userId, request), "User status updated successfully");
    }

    // =========================================================================
    // LOYALTY  —  /api/v1/admin/loyalty
    // Add points to a user · redeem points from a user
    // =========================================================================

    @PostMapping("/loyalty/add")
    @Operation(summary = "Add points to a user (Admin)")
    public ApiResponse<LoyaltyResponse> addPoints(@Valid @RequestBody LoyaltyAddRequest request) {
        return ApiResponse.success(loyaltyPointService.addPoints(request), "Points added successfully");
    }

    @PostMapping("/loyalty/{userId}/redeem")
    @Operation(summary = "Redeem points from a user (Admin)")
    public ApiResponse<LoyaltyResponse> redeemPoints(
            @PathVariable Long userId,
            @RequestParam @Min(1) int points
    ) {
        return ApiResponse.success(loyaltyPointService.redeemPoints(userId, points), "Points redeemed successfully");
    }

    // =========================================================================
    // REPORTS  —  /api/v1/admin/reports
    // Revenue · top movies by tickets · room occupancy
    // =========================================================================

    @GetMapping("/reports/revenue")
    @Operation(summary = "Revenue report")
    public ApiResponse<RevenueReportResponse> revenue(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ApiResponse.success(reportService.getRevenue(from, to));
    }

    @GetMapping("/reports/top-movies")
    @Operation(summary = "Top movies by tickets sold")
    public ApiResponse<List<TopMovieResponse>> topMovies(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(reportService.getTopMovies(from, to, limit));
    }

    @GetMapping("/reports/occupancy")
    @Operation(summary = "Room occupancy rate")
    public ApiResponse<List<RoomOccupancyResponse>> occupancy(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ApiResponse.success(reportService.getRoomOccupancy(from, to));
    }

    // =========================================================================
    // REVIEW MODERATION  —  /api/v1/admin/reviews
    // List all reviews · hide a review · delete a review
    // =========================================================================

    @GetMapping("/reviews")
    @Operation(summary = "List all reviews (Admin)")
    public ApiResponse<PageResponse<ReviewResponse>> listReviews(
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(reviewService.getAllReviewsAdmin(movieId, status, page, size));
    }

    @PatchMapping("/reviews/{reviewId}/hide")
    @Operation(summary = "Hide a review (Admin)")
    public ApiResponse<ReviewResponse> hideReview(@PathVariable Long reviewId) {
        return ApiResponse.success(reviewService.hideReview(reviewId), "Review hidden");
    }

    @DeleteMapping("/reviews/{reviewId}")
    @Operation(summary = "Delete a review (Admin)")
    public ApiResponse<Void> deleteReview(@PathVariable Long reviewId) {
        reviewService.deleteReview(reviewId);
        return ApiResponse.success(null, "Review deleted");
    }

    // =========================================================================
    // RECOMMENDATION DEBUG  —  /api/v1/admin/recommendations
    // Inspect a user's preference signals and recommended movies
    // =========================================================================

    @GetMapping("/recommendations/users/{userId}/debug")
    @Operation(summary = "Debug user recommendations (Admin)")
    public ApiResponse<RecommendationDebugResponse> debugUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(recommendationService.debugUser(userId, limit));
    }

    // =========================================================================
    // UPLOADS  —  /api/v1/admin/uploads
    // Upload image to Cloudinary
    // =========================================================================

    @PostMapping("/uploads/images")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload image to Cloudinary (Admin)")
    public ApiResponse<UploadedFileResponse> uploadImage(
            @RequestParam MultipartFile file,
            @RequestParam(defaultValue = "images") String folder,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.success(
                cloudinaryUploadService.uploadImage(file, folder, currentUser.id()),
                "Image uploaded successfully"
        );
    }
}
