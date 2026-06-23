package com.sba301.cinemaai.service.impl;

import com.sba301.cinemaai.dto.request.recommendation.TrailerInteractionRequest;
import com.sba301.cinemaai.dto.response.recommendation.FavoriteActorRecommendationResponse;
import com.sba301.cinemaai.dto.response.recommendation.MovieRecommendationResponse;
import com.sba301.cinemaai.dto.response.recommendation.RecommendationDebugResponse;
import com.sba301.cinemaai.dto.response.recommendation.TrailerInteractionResponse;
import com.sba301.cinemaai.dto.response.recommendation.UserPreferenceProfileResponse;
import com.sba301.cinemaai.entity.Actor;
import com.sba301.cinemaai.entity.Booking;
import com.sba301.cinemaai.entity.BookingTicket;
import com.sba301.cinemaai.entity.Genre;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.MovieActor;
import com.sba301.cinemaai.entity.MovieGenre;
import com.sba301.cinemaai.entity.Review;
import com.sba301.cinemaai.entity.TrailerInteraction;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.UserPreferenceProfile;
import com.sba301.cinemaai.entity.Wishlist;
import com.sba301.cinemaai.enums.BookingStatus;
import com.sba301.cinemaai.enums.MovieStatus;
import com.sba301.cinemaai.enums.ReviewStatus;
import com.sba301.cinemaai.enums.TrailerInteractionType;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.recommendation.RecommendationCandidate;
import com.sba301.cinemaai.recommendation.RecommendationContext;
import com.sba301.cinemaai.recommendation.RecommendationStrategy;
import com.sba301.cinemaai.recommendation.SignalWeights;
import com.sba301.cinemaai.repository.ActorRepository;
import com.sba301.cinemaai.repository.BookingRepository;
import com.sba301.cinemaai.repository.BookingTicketRepository;
import com.sba301.cinemaai.repository.GenreRepository;
import com.sba301.cinemaai.repository.MovieActorRepository;
import com.sba301.cinemaai.repository.MovieGenreRepository;
import com.sba301.cinemaai.repository.MovieRepository;
import com.sba301.cinemaai.repository.ReviewRepository;
import com.sba301.cinemaai.repository.TrailerInteractionRepository;
import com.sba301.cinemaai.repository.UserPreferenceProfileRepository;
import com.sba301.cinemaai.repository.UserRepository;
import com.sba301.cinemaai.repository.WishlistRepository;
import com.sba301.cinemaai.service.RecommendationService;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Hybrid Content-Based Recommendation Service.
 *
 * <h3>Luồng xây dựng Profile người dùng (refreshProfile)</h3>
 * <p>Mỗi lần refresh, hệ thống đọc toàn bộ lịch sử tương tác của user và
 * tính điểm tích lũy cho từng thể loại / diễn viên / đạo diễn theo công thức:</p>
 *
 * <pre>
 * feature_score[F] += Σ signal_contribution_i   (với mọi tương tác i liên quan đến feature F)
 *
 * signal_contribution_i = normalized_value_i × weight_i
 * </pre>
 *
 * <h3>Các tín hiệu và cách chuẩn hóa</h3>
 * <table border="1">
 *   <tr><th>Tín hiệu</th><th>Giá trị chuẩn hóa</th><th>Trọng số mặc định</th></tr>
 *   <tr><td>Trailer COMPLETE</td><td>1.0</td><td>trailerComplete = 5.0</td></tr>
 *   <tr><td>Trailer VIEW (tỉ lệ watch)</td><td>watchRatio ∈ [0,1]</td><td>trailerViewMax = 5.0</td></tr>
 *   <tr><td>Trailer CLICK</td><td>1.0</td><td>trailerClick = 1.0</td></tr>
 *   <tr><td>Trailer SKIP</td><td>-1.0</td><td>trailerSkip = -1.0 (âm)</td></tr>
 *   <tr><td>Đặt vé (PAID/USED)</td><td>1.0</td><td>booking = 4.0</td></tr>
 *   <tr><td>Số vé mua</td><td>min(1, tickets/saturation)</td><td>ticketCountMax = 1.5</td></tr>
 *   <tr><td>Review ≥ 4★</td><td>rating × reviewHighMultiplier</td><td>reviewHighMultiplier = 1.5</td></tr>
 *   <tr><td>Review 3★</td><td>0.0 (trung tính)</td><td>—</td></tr>
 *   <tr><td>Review &lt; 3★</td><td>max(reviewLowCap, rating−3)</td><td>reviewLowCap = -2.0</td></tr>
 *   <tr><td>Wishlist</td><td>1.0</td><td>wishlist = 3.0</td></tr>
 * </table>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationServiceImpl implements RecommendationService {

    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final ActorRepository actorRepository;
    private final MovieGenreRepository movieGenreRepository;
    private final MovieActorRepository movieActorRepository;
    private final BookingRepository bookingRepository;
    private final BookingTicketRepository bookingTicketRepository;
    private final ReviewRepository reviewRepository;
    private final TrailerInteractionRepository trailerInteractionRepository;
    private final WishlistRepository wishlistRepository;
    private final GenreRepository genreRepository;
    private final UserPreferenceProfileRepository preferenceProfileRepository;
    private final RecommendationStrategy recommendationStrategy;
    private final SignalWeights signalWeights;

    // ─── Public API ───────────────────────────────────────────────────────────

    @Override
    @Transactional
    public TrailerInteractionResponse recordTrailerInteraction(String email, TrailerInteractionRequest request) {
        User user = findUserByEmail(email);
        Movie movie = movieRepository.findById(request.movieId())
                .orElseThrow(() -> new NotFoundException("Movie not found"));
        validateTrailerSeconds(request);

        TrailerInteraction saved = trailerInteractionRepository.save(new TrailerInteraction(
                user, movie,
                request.interactionType(),
                request.watchedSeconds(),
                request.totalSeconds()
        ));
        refreshProfileInternal(user);
        return toTrailerInteractionResponse(saved);
    }

    @Override
    @Transactional
    public UserPreferenceProfileResponse refreshProfile(String email) {
        return toProfileResponse(refreshProfileInternal(findUserByEmail(email)));
    }

    @Override
    @Async
    public void refreshProfileAsync(String email) {
        try {
            refreshProfile(email);
            log.debug("[Recommendation] Profile async refreshed for {}", email);
        } catch (Exception e) {
            log.warn("[Recommendation] Async profile refresh failed for {}: {}", email, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserPreferenceProfileResponse getProfile(String email) {
        User user = findUserByEmail(email);
        UserPreferenceProfile profile = preferenceProfileRepository.findByUser(user)
                .orElseGet(() -> new UserPreferenceProfile(user));
        return toProfileResponse(profile);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovieRecommendationResponse> recommendMovies(String email, int limit) {
        User user = findUserByEmail(email);
        UserPreferenceProfile profile = preferenceProfileRepository.findByUser(user)
                .orElseGet(() -> new UserPreferenceProfile(user));
        RecommendationContext context = buildContext(user, profile);
        List<Movie> candidates = movieRepository.findAll().stream()
                .filter(m -> m.getStatus() == MovieStatus.NOW_SHOWING || m.getStatus() == MovieStatus.UPCOMING)
                .toList();
        return recommendationStrategy.recommend(context, candidates)
                .stream()
                .limit(safeLimit(limit))
                .map(this::toMovieRecommendationResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FavoriteActorRecommendationResponse> recommendByFavoriteActors(String email, int limit) {
        User user = findUserByEmail(email);
        UserPreferenceProfile profile = preferenceProfileRepository.findByUser(user)
                .orElseGet(() -> new UserPreferenceProfile(user));
        Map<Long, Double> actorScores = parseLongScoreMap(profile.getActorScores());
        Set<Long> watchedMovieIds = collectWatchedMovieIds(user);

        return actorScores.entrySet().stream()
                .sorted(Map.Entry.<Long, Double>comparingByValue().reversed())
                .limit(5)
                .map(entry -> toFavoriteActorRecommendation(entry.getKey(), entry.getValue(), watchedMovieIds, limit))
                .filter(response -> !response.movies().isEmpty())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RecommendationDebugResponse debugUser(Long userId, int limit) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        UserPreferenceProfile profile = preferenceProfileRepository.findByUser(user)
                .orElseGet(() -> new UserPreferenceProfile(user));
        return new RecommendationDebugResponse(
                user.getId(),
                toProfileResponse(profile),
                trailerInteractionRepository.findByUser(user).size(),
                bookingRepository.findByUser(user).size(),
                reviewRepository.findByUser(user).size(),
                wishlistRepository.findByUser(user).size(),
                recommendMovies(user.getEmail(), limit)
        );
    }

    // ─── Profile building ─────────────────────────────────────────────────────

    @Transactional
    protected UserPreferenceProfile refreshProfileInternal(User user) {
        ScoreAccumulator scores = new ScoreAccumulator();

        applyTrailerSignals(user, scores);
        applyBookingSignals(user, scores);
        applyReviewSignals(user, scores);
        applyWishlistSignals(user, scores);

        UserPreferenceProfile profile = preferenceProfileRepository.findByUser(user)
                .orElseGet(() -> preferenceProfileRepository.save(new UserPreferenceProfile(user)));

        profile.setGenreScores(serializeLongScores(scores.genreScores));
        profile.setActorScores(serializeLongScores(scores.actorScores));
        profile.setDirectorScores(serializeStringScores(scores.directorScores));
        profile.setCohortKey(assignCohortKey(scores.genreScores));
        profile.setLastRefreshedAt(LocalDateTime.now());
        return profile;
    }

    // ─── Signal processors ────────────────────────────────────────────────────

    /**
     * Tín hiệu Trailer: chuẩn hóa theo loại tương tác và tỉ lệ xem.
     *
     * <pre>
     * COMPLETE → trailerComplete (default 5.0)
     * SKIP     → trailerSkip     (default -1.0)
     * CLICK    → trailerClick    (default  1.0)
     * VIEW     → watchRatio × trailerViewMax (0.0 – 5.0)
     * </pre>
     */
    private void applyTrailerSignals(User user, ScoreAccumulator scores) {
        for (TrailerInteraction interaction : trailerInteractionRepository.findByUser(user)) {
            double weight = normalizeTrailerSignal(interaction);
            if (weight != 0) {
                addMovieFeatureScores(interaction.getMovie(), weight, scores);
            }
        }
    }

    /**
     * Tín hiệu Booking + Ticket count.
     *
     * <pre>
     * contribution = booking + min(1, tickets / saturation) × ticketCountMax
     *              = 4.0   + min(1, tickets / 6)          × 1.5
     * </pre>
     */
    private void applyBookingSignals(User user, ScoreAccumulator scores) {
        for (Booking booking : bookingRepository.findByUser(user)) {
            if (booking.getStatus() != BookingStatus.PAID && booking.getStatus() != BookingStatus.USED) {
                continue;
            }
            double contribution = signalWeights.getBooking();

            // Bonus từ số lượng vé: người mua nhiều vé → quan tâm phim hơn
            int ticketCount = sumTickets(booking);
            double ticketBonus = Math.min(1.0, ticketCount / (double) signalWeights.getTicketCountSaturation())
                    * signalWeights.getTicketCountMax();
            contribution += ticketBonus;

            addMovieFeatureScores(booking.getShowtime().getMovie(), contribution, scores);
        }
    }

    /**
     * Tín hiệu Review.
     *
     * <pre>
     * rating ≥ 4 → rating × reviewHighMultiplier  (positive: 6.0 – 7.5)
     * rating = 3 → 0.0  (trung tính, bỏ qua)
     * rating < 3 → max(reviewLowCap, rating − 3)  (negative: -1.0 đến -2.0)
     * </pre>
     */
    private void applyReviewSignals(User user, ScoreAccumulator scores) {
        for (Review review : reviewRepository.findByUser(user)) {
            if (review.getStatus() != ReviewStatus.VISIBLE) {
                continue;
            }
            double weight = normalizeReviewSignal(review.getRating());
            if (weight != 0) {
                addMovieFeatureScores(review.getMovie(), weight, scores);
            }
        }
    }

    /**
     * Tín hiệu Wishlist: user thêm phim vào danh sách yêu thích.
     *
     * <pre>contribution = wishlist (default 3.0)</pre>
     */
    private void applyWishlistSignals(User user, ScoreAccumulator scores) {
        for (Wishlist wishlist : wishlistRepository.findByUser(user)) {
            addMovieFeatureScores(wishlist.getMovie(), signalWeights.getWishlist(), scores);
        }
    }

    // ─── Normalization helpers ────────────────────────────────────────────────

    private double normalizeTrailerSignal(TrailerInteraction interaction) {
        TrailerInteractionType type = interaction.getInteractionType();
        if (type == TrailerInteractionType.COMPLETE) {
            return signalWeights.getTrailerComplete();
        }
        if (type == TrailerInteractionType.SKIP) {
            return signalWeights.getTrailerSkip();
        }
        if (type == TrailerInteractionType.CLICK) {
            return signalWeights.getTrailerClick();
        }
        // VIEW – dùng tỉ lệ watchedSeconds / totalSeconds
        if (interaction.getWatchedSeconds() != null && interaction.getTotalSeconds() != null
                && interaction.getTotalSeconds() > 0) {
            double watchRatio = Math.min(1.0, interaction.getWatchedSeconds() / (double) interaction.getTotalSeconds());
            return watchRatio * signalWeights.getTrailerViewMax();
        }
        return signalWeights.getTrailerClick(); // fallback nếu không có thông tin
    }

    private double normalizeReviewSignal(int rating) {
        if (rating >= 4) {
            return rating * signalWeights.getReviewHighMultiplier();
        }
        if (rating == 3) {
            return 0.0;
        }
        return Math.max(signalWeights.getReviewLowCap(), rating - 3.0);
    }

    private int sumTickets(Booking booking) {
        try {
            return bookingTicketRepository.findByBooking(booking).stream()
                    .mapToInt(BookingTicket::getQuantity)
                    .sum();
        } catch (Exception e) {
            log.debug("[Recommendation] Could not load tickets for booking {}: {}", booking.getId(), e.getMessage());
            return 1;
        }
    }

    // ─── Feature accumulation ─────────────────────────────────────────────────

    private void addMovieFeatureScores(Movie movie, double weight, ScoreAccumulator scores) {
        if (weight == 0) {
            return;
        }
        for (MovieGenre movieGenre : movieGenreRepository.findByMovie(movie)) {
            Genre genre = movieGenre.getGenre();
            scores.genreScores.merge(genre.getId(), weight, Double::sum);
        }
        for (MovieActor movieActor : movieActorRepository.findByMovie(movie)) {
            Actor actor = movieActor.getActor();
            scores.actorScores.merge(actor.getId(), weight, Double::sum);
        }
        if (movie.getDirector() != null && !movie.getDirector().isBlank()) {
            scores.directorScores.merge(movie.getDirector().toLowerCase(), weight, Double::sum);
        }
    }

    // ─── Cohort assignment ────────────────────────────────────────────────────

    /**
     * Gán cohort key dựa trên thể loại yêu thích nhất của user.
     * Cohort được dùng cho tính năng collaborative filtering sau này.
     */
    private String assignCohortKey(Map<Long, Double> genreScores) {
        if (genreScores.isEmpty()) {
            return "general";
        }
        Long topGenreId = genreScores.entrySet().stream()
                .filter(e -> e.getValue() > 0)
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
        if (topGenreId == null) {
            return "general";
        }
        return genreRepository.findById(topGenreId)
                .map(genre -> genre.getName().toLowerCase().replace(" ", "-") + "-fan")
                .orElse("general");
    }

    // ─── Context & mapping helpers ────────────────────────────────────────────

    private RecommendationContext buildContext(User user, UserPreferenceProfile profile) {
        return new RecommendationContext(
                user,
                profile,
                parseLongScoreMap(profile.getGenreScores()),
                parseLongScoreMap(profile.getActorScores()),
                parseStringScoreMap(profile.getDirectorScores()),
                collectWatchedMovieIds(user)
        );
    }

    private Set<Long> collectWatchedMovieIds(User user) {
        Set<Long> movieIds = new LinkedHashSet<>();
        trailerInteractionRepository.findByUser(user)
                .forEach(i -> movieIds.add(i.getMovie().getId()));
        bookingRepository.findByUser(user)
                .forEach(b -> movieIds.add(b.getShowtime().getMovie().getId()));
        reviewRepository.findByUser(user)
                .forEach(r -> movieIds.add(r.getMovie().getId()));
        return movieIds;
    }

    private FavoriteActorRecommendationResponse toFavoriteActorRecommendation(
            Long actorId, double preferenceScore, Set<Long> watchedMovieIds, int limit) {
        Actor actor = actorRepository.findById(actorId)
                .orElseThrow(() -> new NotFoundException("Actor not found"));
        List<MovieRecommendationResponse> movies = movieActorRepository.findByActor(actor).stream()
                .map(MovieActor::getMovie)
                .filter(m -> !watchedMovieIds.contains(m.getId()))
                .filter(m -> m.getStatus() == MovieStatus.NOW_SHOWING || m.getStatus() == MovieStatus.UPCOMING)
                .sorted(Comparator.comparing(Movie::getReleaseDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(safeLimit(limit))
                .map(m -> new MovieRecommendationResponse(
                        m.getId(),
                        m.getTitle(),
                        m.getAgeRating() == null ? null : m.getAgeRating().getLabel(),
                        m.getDirector(),
                        m.getReleaseDate(),
                        m.getPosterUrl(),
                        preferenceScore,
                        List.of("Phim mới của diễn viên yêu thích: " + actor.getName())))
                .toList();
        return new FavoriteActorRecommendationResponse(actor.getId(), actor.getName(), preferenceScore, movies);
    }

    private MovieRecommendationResponse toMovieRecommendationResponse(RecommendationCandidate candidate) {
        Movie movie = candidate.getMovie();
        return new MovieRecommendationResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getAgeRating() == null ? null : movie.getAgeRating().getLabel(),
                movie.getDirector(),
                movie.getReleaseDate(),
                movie.getPosterUrl(),
                Math.round(candidate.getScore() * 100.0) / 100.0,
                candidate.getReasons()
        );
    }

    private UserPreferenceProfileResponse toProfileResponse(UserPreferenceProfile profile) {
        return new UserPreferenceProfileResponse(
                profile.getUser().getId(),
                profile.getCohortKey(),
                parseLongScoreMap(profile.getGenreScores()),
                parseLongScoreMap(profile.getActorScores()),
                parseStringScoreMap(profile.getDirectorScores()),
                profile.getLastRefreshedAt()
        );
    }

    private TrailerInteractionResponse toTrailerInteractionResponse(TrailerInteraction interaction) {
        return new TrailerInteractionResponse(
                interaction.getId(),
                interaction.getMovie().getId(),
                interaction.getMovie().getTitle(),
                interaction.getInteractionType(),
                interaction.getWatchedSeconds(),
                interaction.getTotalSeconds(),
                interaction.getCreatedAt()
        );
    }

    // ─── Validation & utilities ───────────────────────────────────────────────

    private void validateTrailerSeconds(TrailerInteractionRequest request) {
        if (request.watchedSeconds() != null && request.totalSeconds() != null
                && request.watchedSeconds() > request.totalSeconds()) {
            throw new BadRequestException("Watched seconds cannot exceed total seconds");
        }
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private int safeLimit(int limit) {
        return Math.max(1, Math.min(limit, 50));
    }

    // ─── Serialization ────────────────────────────────────────────────────────

    private String serializeLongScores(Map<Long, Double> scores) {
        StringBuilder builder = new StringBuilder();
        scores.forEach((key, value) -> builder.append(key).append("=").append(round(value)).append(";"));
        return builder.toString();
    }

    private String serializeStringScores(Map<String, Double> scores) {
        StringBuilder builder = new StringBuilder();
        scores.forEach((key, value) -> builder.append(key).append("=").append(round(value)).append(";"));
        return builder.toString();
    }

    private Map<Long, Double> parseLongScoreMap(String rawValue) {
        Map<Long, Double> scores = new LinkedHashMap<>();
        if (rawValue == null || rawValue.isBlank()) {
            return scores;
        }
        for (String token : rawValue.split(";")) {
            String[] parts = token.split("=");
            if (parts.length == 2) {
                scores.put(Long.parseLong(parts[0]), Double.parseDouble(parts[1]));
            }
        }
        return scores;
    }

    private Map<String, Double> parseStringScoreMap(String rawValue) {
        Map<String, Double> scores = new LinkedHashMap<>();
        if (rawValue == null || rawValue.isBlank()) {
            return scores;
        }
        for (String token : rawValue.split(";")) {
            String[] parts = token.split("=");
            if (parts.length == 2) {
                scores.put(parts[0], Double.parseDouble(parts[1]));
            }
        }
        return scores;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    // ─── Inner classes ────────────────────────────────────────────────────────

    private static class ScoreAccumulator {
        private final Map<Long, Double> genreScores = new LinkedHashMap<>();
        private final Map<Long, Double> actorScores = new LinkedHashMap<>();
        private final Map<String, Double> directorScores = new LinkedHashMap<>();
    }
}
