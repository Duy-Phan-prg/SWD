package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.request.booking.CreateBookingRequest;
import com.sba301.cinemaai.dto.request.booking.HoldSeatsRequest;
import com.sba301.cinemaai.dto.request.booking.RefundRequest;
import com.sba301.cinemaai.dto.request.notification.NotificationCreateRequest;
import com.sba301.cinemaai.dto.request.recommendation.TrailerInteractionRequest;
import com.sba301.cinemaai.dto.request.review.ReviewRequest;
import com.sba301.cinemaai.dto.request.ticket.TicketPriceValidationRequest;
import com.sba301.cinemaai.dto.request.user.ChangePasswordRequest;
import com.sba301.cinemaai.dto.request.user.UserProfileUpdateRequest;
import com.sba301.cinemaai.dto.request.wishlist.WishlistCreateRequest;
import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.dto.response.PageResponse;
import com.sba301.cinemaai.dto.response.booking.BookingResponse;
import com.sba301.cinemaai.dto.response.cinema.CinemaResponse;
import com.sba301.cinemaai.dto.response.cinema.RoomResponse;
import com.sba301.cinemaai.dto.response.cinema.ShowtimeResponse;
import com.sba301.cinemaai.dto.response.cinema.ShowtimeSeatMapResponse;
import com.sba301.cinemaai.dto.response.food.FoodComboResponse;
import com.sba301.cinemaai.dto.response.food.FoodItemResponse;
import com.sba301.cinemaai.dto.response.loyalty.LoyaltyResponse;
import com.sba301.cinemaai.dto.response.movie.ActorResponse;
import com.sba301.cinemaai.dto.response.movie.GenreResponse;
import com.sba301.cinemaai.dto.response.movie.MovieResponse;
import com.sba301.cinemaai.dto.response.notification.NotificationResponse;
import com.sba301.cinemaai.dto.response.payment.PaymentResponse;
import com.sba301.cinemaai.dto.response.recommendation.FavoriteActorRecommendationResponse;
import com.sba301.cinemaai.dto.response.recommendation.MovieRecommendationResponse;
import com.sba301.cinemaai.dto.response.recommendation.TrailerInteractionResponse;
import com.sba301.cinemaai.dto.response.recommendation.UserPreferenceProfileResponse;
import com.sba301.cinemaai.dto.response.review.ReviewResponse;
import com.sba301.cinemaai.dto.response.ticket.TicketComboResponse;
import com.sba301.cinemaai.dto.response.ticket.TicketPriceValidationResponse;
import com.sba301.cinemaai.dto.response.user.UserProfileResponse;
import com.sba301.cinemaai.dto.response.wallet.WalletResponse;
import com.sba301.cinemaai.dto.response.wishlist.WishlistResponse;
import com.sba301.cinemaai.enums.MovieStatus;
import com.sba301.cinemaai.security.AuthenticatedUser;
import com.sba301.cinemaai.service.ActorService;
import com.sba301.cinemaai.service.BookingService;
import com.sba301.cinemaai.service.CinemaService;
import com.sba301.cinemaai.service.CloudinaryUploadService;
import com.sba301.cinemaai.service.FoodService;
import com.sba301.cinemaai.service.GenreService;
import com.sba301.cinemaai.service.LoyaltyPointService;
import com.sba301.cinemaai.service.MovieService;
import com.sba301.cinemaai.service.NotificationService;
import com.sba301.cinemaai.service.PaymentService;
import com.sba301.cinemaai.service.RecommendationService;
import com.sba301.cinemaai.service.ReviewService;
import com.sba301.cinemaai.service.RoomService;
import com.sba301.cinemaai.service.ShowtimeService;
import com.sba301.cinemaai.service.TicketPricingService;
import com.sba301.cinemaai.service.UserService;
import com.sba301.cinemaai.service.WalletService;
import com.sba301.cinemaai.service.WishlistService;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
 * Single consolidated controller for all CUSTOMER + PUBLIC endpoints.
 * Grouped by domain. Public endpoints are open; the rest require an authenticated user.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Customer & Public", description = "Customer and public-facing endpoints")
public class CustomerPublicController {

    private final ActorService actorService;
    private final MovieService movieService;
    private final GenreService genreService;
    private final CinemaService cinemaService;
    private final RoomService roomService;
    private final ShowtimeService showtimeService;
    private final FoodService foodService;
    private final TicketPricingService ticketPricingService;
    private final UserService userService;
    private final CloudinaryUploadService cloudinaryUploadService;
    private final BookingService bookingService;
    private final PaymentService paymentService;
    private final WishlistService wishlistService;
    private final LoyaltyPointService loyaltyPointService;
    private final WalletService walletService;
    private final ReviewService reviewService;
    private final RecommendationService recommendationService;
    private final NotificationService notificationService;

    // =========================================================================
    // USER PROFILE  —  /api/v1/users/me  (authenticated)
    // Get profile · update profile · update avatar · change password
    // =========================================================================

    @GetMapping("/users/me")
    public ApiResponse<UserProfileResponse> currentUser(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(userService.getProfile(user.email()));
    }

    @PutMapping("/users/me")
    public ApiResponse<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody UserProfileUpdateRequest request
    ) {
        return ApiResponse.success(userService.updateProfile(user.email(), request), "Profile updated successfully");
    }

    @PostMapping("/users/me/avatar")
    public ApiResponse<UserProfileResponse> updateAvatar(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam MultipartFile file
    ) {
        String avatarUrl = cloudinaryUploadService.uploadImage(file, "avatars", user.id()).url();
        return ApiResponse.success(userService.updateAvatar(user.email(), avatarUrl), "Avatar updated successfully");
    }

    @PostMapping("/users/me/password")
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(user.email(), request);
        return ApiResponse.success(null, "Password changed successfully");
    }

    // =========================================================================
    // MOVIES  —  /api/v1/movies  (public)
    // Search/list movies · get movie detail
    // =========================================================================

    @GetMapping("/movies")
    public ApiResponse<PageResponse<MovieResponse>> searchMovies(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) MovieStatus status,
            @RequestParam(required = false) Long genreId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(movieService.searchPublic(keyword, status, genreId, fromDate, toDate, page, size));
    }

    @GetMapping("/movies/{movieId}")
    public ApiResponse<MovieResponse> getMovie(@PathVariable Long movieId) {
        return ApiResponse.success(movieService.getPublic(movieId));
    }

    // =========================================================================
    // GENRES  —  /api/v1/genres  (public)
    // List genres · get genre detail
    // =========================================================================

    @GetMapping("/genres")
    public ApiResponse<PageResponse<GenreResponse>> getGenres(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(genreService.getGenres(page, size));
    }

    @GetMapping("/genres/{genreId}")
    public ApiResponse<GenreResponse> getGenre(@PathVariable Long genreId) {
        return ApiResponse.success(genreService.getGenre(genreId));
    }

    // =========================================================================
    // ACTORS  —  /api/v1/actors  (public)
    // List/search actors · get actor · movies by actor
    // =========================================================================

    @GetMapping("/actors")
    @Operation(summary = "List or search actors")
    public ApiResponse<PageResponse<ActorResponse>> getActors(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(actorService.searchPublicActors(keyword, page, size));
    }

    @GetMapping("/actors/{actorId}")
    @Operation(summary = "Get actor details")
    public ApiResponse<ActorResponse> getActor(@PathVariable Long actorId) {
        return ApiResponse.success(actorService.getPublicActor(actorId));
    }

    @GetMapping("/actors/{actorId}/movies")
    @Operation(summary = "Get movies by actor")
    public ApiResponse<List<MovieResponse>> getMoviesByActor(@PathVariable Long actorId) {
        return ApiResponse.success(movieService.getMoviesByActor(actorId));
    }

    // =========================================================================
    // CINEMA & ROOMS  —  /api/v1/cinema(s)  (public)
    // Get cinema · get cinema by id · list rooms · rooms by cinema
    // =========================================================================

    @GetMapping({"/cinema", "/cinemas"})
    public ApiResponse<CinemaResponse> getCinema() {
        return ApiResponse.success(cinemaService.getPublicCinema());
    }

    @GetMapping("/cinemas/{cinemaId}")
    public ApiResponse<CinemaResponse> getCinemaById(@PathVariable Long cinemaId) {
        return ApiResponse.success(cinemaService.getCinema(cinemaId));
    }

    @GetMapping("/cinema/rooms")
    public ApiResponse<List<RoomResponse>> getRooms() {
        return ApiResponse.success(roomService.getRooms());
    }

    @GetMapping("/cinemas/{cinemaId}/rooms")
    public ApiResponse<List<RoomResponse>> getRoomsByCinema(@PathVariable Long cinemaId) {
        return ApiResponse.success(roomService.getRoomsByCinema(cinemaId));
    }

    // =========================================================================
    // SHOWTIMES  —  /api/v1/showtimes  (public)
    // Search showtimes · get showtime · get seat-map
    // =========================================================================

    @GetMapping("/showtimes")
    public ApiResponse<PageResponse<ShowtimeResponse>> searchShowtimes(
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(showtimeService.searchPublic(movieId, roomId, date, page, size));
    }

    @GetMapping("/showtimes/{showtimeId}")
    public ApiResponse<ShowtimeResponse> getShowtime(@PathVariable Long showtimeId) {
        return ApiResponse.success(showtimeService.get(showtimeId));
    }

    @GetMapping("/showtimes/{showtimeId}/seat-map")
    public ApiResponse<ShowtimeSeatMapResponse> getSeatMap(@PathVariable Long showtimeId) {
        return ApiResponse.success(showtimeService.getSeatMap(showtimeId));
    }

    // =========================================================================
    // FOOD  —  /api/v1/foods  (public)
    // List active food items · list active combos
    // =========================================================================

    @GetMapping("/foods/items")
    public ApiResponse<PageResponse<FoodItemResponse>> getFoodItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(foodService.getActiveItems(page, size));
    }

    @GetMapping("/foods/combos")
    public ApiResponse<PageResponse<FoodComboResponse>> getFoodCombos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(foodService.getActiveCombos(page, size));
    }

    // =========================================================================
    // TICKET PRICING  —  /api/v1/ticket-pricing
    // Active ticket combos (hidden) · validate ticket price selection
    // =========================================================================

    @Hidden
    @GetMapping("/ticket-pricing/combos")
    public ApiResponse<List<TicketComboResponse>> getActiveTicketCombos() {
        return ApiResponse.success(ticketPricingService.getCombos(true));
    }

    @PostMapping("/ticket-pricing/validate")
    public ApiResponse<TicketPriceValidationResponse> validatePrice(
            @Valid @RequestBody TicketPriceValidationRequest request
    ) {
        return ApiResponse.success(ticketPricingService.validatePrice(request), "Ticket price validated successfully");
    }

    // =========================================================================
    // BOOKINGS  —  /api/v1/bookings  (customer)
    // Hold seats · create booking · my bookings · detail · cancel · refund-request
    // =========================================================================

    @PostMapping("/bookings/hold")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingResponse> holdSeats(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody HoldSeatsRequest request
    ) {
        return ApiResponse.success(bookingService.holdSeats(user.getUsername(), request), "Seats held successfully");
    }

    @PostMapping("/bookings")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookingResponse> createBooking(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateBookingRequest request
    ) {
        return ApiResponse.success(bookingService.createBooking(user.getUsername(), request), "Booking created successfully");
    }

    @GetMapping("/bookings")
    public ApiResponse<PageResponse<BookingResponse>> getMyBookings(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(bookingService.getMyBookings(user.getUsername(), page, size));
    }

    @GetMapping("/bookings/{bookingId}")
    public ApiResponse<BookingResponse> getMyBooking(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long bookingId
    ) {
        return ApiResponse.success(bookingService.getMyBooking(user.getUsername(), bookingId));
    }

    @DeleteMapping("/bookings/{bookingId}")
    public ApiResponse<BookingResponse> cancelBooking(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long bookingId
    ) {
        return ApiResponse.success(bookingService.cancel(user.getUsername(), bookingId), "Booking cancelled successfully");
    }

    @PostMapping("/bookings/{bookingId}/refund-request")
    public ApiResponse<BookingResponse> requestBookingRefund(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long bookingId,
            @Valid @RequestBody RefundRequest request
    ) {
        return ApiResponse.success(
                bookingService.requestRefund(user.getUsername(), bookingId, request.reason()),
                "Refund requested successfully"
        );
    }

    // =========================================================================
    // PAYMENTS  —  /api/v1/payments  (customer + VNPay callbacks)
    // Create VNPay URL · VNPay return · VNPay IPN · mock pay · payment by booking
    // =========================================================================

    @PostMapping("/payments/vnpay/create")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Create VNPAY payment URL")
    public ResponseEntity<ApiResponse<PaymentResponse>> createVnpayPayment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam Long bookingId,
            HttpServletRequest request
    ) {
        String clientIp = getClientIp(request);
        PaymentResponse response = paymentService.createVnpayPayment(user.email(), bookingId, clientIp);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment URL created"));
    }

    @GetMapping("/payments/vnpay/return")
    @Operation(summary = "VNPAY return URL handler")
    public ResponseEntity<Void> vnpayReturn(HttpServletRequest request) {
        Map<String, String> params = extractParams(request);
        paymentService.handleVnpayReturn(params);
        String queryString = request.getQueryString();
        String redirectUrl = "http://localhost:3000/payment-callback" + (queryString != null ? "?" + queryString : "");
        return ResponseEntity.status(302).header("Location", redirectUrl).build();
    }

    @GetMapping("/payments/vnpay/ipn")
    @Operation(summary = "VNPAY IPN webhook")
    public ResponseEntity<String> vnpayIpn(HttpServletRequest request) {
        Map<String, String> params = extractParams(request);
        String result = paymentService.handleVnpayIpn(params);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/payments/mock")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Mock payment (dev only)")
    public ResponseEntity<ApiResponse<PaymentResponse>> mockPayment(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam Long bookingId
    ) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.mockPayment(user.email(), bookingId), "Payment confirmed"));
    }

    @GetMapping("/payments/booking/{bookingId}")
    @SecurityRequirement(name = "Bearer Authentication")
    @Operation(summary = "Get payment by booking")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByBooking(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable Long bookingId
    ) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.getByBooking(user.email(), bookingId)));
    }

    // =========================================================================
    // WISHLIST  —  /api/v1/wishlist  (customer)
    // Add movie · get my wishlist · remove movie
    // =========================================================================

    @PostMapping("/wishlist")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add movie to wishlist")
    public ApiResponse<WishlistResponse> addToWishlist(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody WishlistCreateRequest request
    ) {
        return ApiResponse.success(
                wishlistService.addToWishlist(currentUser.getUsername(), request),
                "Movie added to wishlist"
        );
    }

    @GetMapping("/wishlist")
    @Operation(summary = "Get my wishlist")
    public ApiResponse<List<WishlistResponse>> getMyWishlist(
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.success(wishlistService.getWishlist(currentUser.getUsername()));
    }

    @DeleteMapping("/wishlist/{movieId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Remove movie from wishlist")
    public void removeFromWishlist(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long movieId
    ) {
        wishlistService.removeFromWishlist(currentUser.getUsername(), movieId);
    }

    // =========================================================================
    // LOYALTY  —  /api/v1/loyalty  (customer)
    // Get my points · redeem my points
    // =========================================================================

    @GetMapping("/loyalty/me")
    @Operation(summary = "Get my loyalty points")
    public ApiResponse<LoyaltyResponse> getMyPoints(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ApiResponse.success(loyaltyPointService.getMyPoints(currentUser.getUsername()));
    }

    @PostMapping("/loyalty/me/redeem")
    @Operation(summary = "Redeem loyalty points")
    public ApiResponse<LoyaltyResponse> redeemMyPoints(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam int points
    ) {
        return ApiResponse.success(
                loyaltyPointService.redeemMyPoints(currentUser.getUsername(), points),
                "Points redeemed successfully"
        );
    }

    // =========================================================================
    // WALLET  —  /api/v1/wallet  (customer)
    // Get my wallet balance
    // =========================================================================

    @GetMapping("/wallet/me")
    @Operation(summary = "Get my wallet")
    public ApiResponse<WalletResponse> getMyWallet(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ApiResponse.success(walletService.getMyWallet(currentUser.getUsername()));
    }

    // =========================================================================
    // REVIEWS  —  /api/v1/reviews  (public read, customer write)
    // Public reviews · average rating · create/update/delete own review
    // =========================================================================

    @GetMapping("/reviews/movies/{movieId}")
    @Operation(summary = "Get public reviews for a movie")
    public ApiResponse<PageResponse<ReviewResponse>> getReviewsByMovie(
            @PathVariable Long movieId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(reviewService.getPublicReviewsByMovie(movieId, page, size));
    }

    @GetMapping("/reviews/movies/{movieId}/average-rating")
    @Operation(summary = "Get average rating for a movie")
    public ApiResponse<Double> getAverageRating(@PathVariable Long movieId) {
        return ApiResponse.success(reviewService.getAverageRating(movieId));
    }

    @PostMapping("/reviews/movies/{movieId}")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Create a review")
    public ApiResponse<ReviewResponse> createReview(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long movieId,
            @Valid @RequestBody ReviewRequest request
    ) {
        return ApiResponse.success(
                reviewService.createReview(currentUser.getUsername(), movieId, request),
                "Review created successfully"
        );
    }

    @PutMapping("/reviews/{reviewId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Update own review")
    public ApiResponse<ReviewResponse> updateReview(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequest request
    ) {
        return ApiResponse.success(
                reviewService.updateReview(currentUser.getUsername(), reviewId, request),
                "Review updated successfully"
        );
    }

    @DeleteMapping("/reviews/{reviewId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Delete own review")
    public ApiResponse<Void> deleteMyReview(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long reviewId
    ) {
        reviewService.deleteReview(reviewId);
        return ApiResponse.success(null, "Review deleted");
    }

    // =========================================================================
    // RECOMMENDATIONS  —  /api/v1/recommendations  (customer)
    // Record trailer interaction · refresh/get profile · recommend movies/actors
    // =========================================================================

    @PostMapping("/recommendations/trailer-interactions")
    @Operation(summary = "Record trailer interaction")
    public ApiResponse<TrailerInteractionResponse> recordTrailerInteraction(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody TrailerInteractionRequest request
    ) {
        return ApiResponse.success(
                recommendationService.recordTrailerInteraction(user.email(), request),
                "Trailer interaction recorded successfully"
        );
    }

    @PostMapping("/recommendations/preferences/refresh")
    @Operation(summary = "Refresh my preference profile")
    public ApiResponse<UserPreferenceProfileResponse> refreshProfile(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(recommendationService.refreshProfile(user.email()), "Preference profile refreshed");
    }

    @GetMapping("/recommendations/preferences/me")
    @Operation(summary = "Get my preference profile")
    public ApiResponse<UserPreferenceProfileResponse> getProfile(@AuthenticationPrincipal AuthenticatedUser user) {
        return ApiResponse.success(recommendationService.getProfile(user.email()));
    }

    @GetMapping("/recommendations/movies")
    @Operation(summary = "Get personalized movie recommendations")
    public ApiResponse<List<MovieRecommendationResponse>> recommendMovies(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(recommendationService.recommendMovies(user.email(), limit));
    }

    @GetMapping("/recommendations/favorite-actors")
    @Operation(summary = "Get recommendations by favorite actors")
    public ApiResponse<List<FavoriteActorRecommendationResponse>> recommendByFavoriteActors(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(recommendationService.recommendByFavoriteActors(user.email(), limit));
    }

    // =========================================================================
    // NOTIFICATIONS  —  /api/v1/notifications
    // Create (ADMIN) · my notifications · unread · mark one read · mark all read
    // =========================================================================

    @PostMapping("/notifications")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create notification for a user (Admin)")
    public ApiResponse<NotificationResponse> createNotification(
            @Valid @RequestBody NotificationCreateRequest request
    ) {
        return ApiResponse.success(
                notificationService.createForUser(request),
                "Notification created successfully"
        );
    }

    @GetMapping("/notifications/me")
    @Operation(summary = "Get my notifications")
    public ApiResponse<List<NotificationResponse>> getMyNotifications(
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.success(notificationService.getMyNotifications(currentUser.id()));
    }

    @GetMapping("/notifications/me/unread")
    @Operation(summary = "Get my unread notifications")
    public ApiResponse<List<NotificationResponse>> getMyUnread(
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.success(notificationService.getMyUnread(currentUser.id()));
    }

    @PatchMapping("/notifications/{id}/read")
    @Operation(summary = "Mark notification as read")
    public ApiResponse<NotificationResponse> markRead(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id
    ) {
        return ApiResponse.success(
                notificationService.markRead(currentUser.id(), id),
                "Notification marked as read"
        );
    }

    @PatchMapping("/notifications/me/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ApiResponse<Integer> markAllRead(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        int updated = notificationService.markAllRead(currentUser.id());
        return ApiResponse.success(updated, updated + " notification(s) marked as read");
    }

    // =========================================================================
    // Helpers (from PaymentController)
    // =========================================================================

    private Map<String, String> extractParams(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (values != null && values.length > 0) {
                params.put(key, values[0]);
            }
        });
        return params;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
