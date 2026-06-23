package com.sba301.cinemaai.recommendation;

import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.MovieActor;
import com.sba301.cinemaai.entity.MovieGenre;
import com.sba301.cinemaai.repository.MovieActorRepository;
import com.sba301.cinemaai.repository.MovieGenreRepository;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

/**
 * Hybrid Content-Based Recommendation Strategy.
 *
 * <h3>Công thức chấm điểm phim ứng viên</h3>
 * <pre>
 * score(M) = Σ_{g ∈ genres(M)}   genreProfile[g]
 *          + Σ_{a ∈ actors(M)}   actorProfile[a]  × actorMultiplier
 *          + directorProfile[director(M)]         × directorMultiplier
 *          + recencyBonus  (nếu phim ra mắt trong vòng recencyMonths tháng)
 * </pre>
 *
 * <h3>Profile người dùng được xây dựng từ các tín hiệu có trọng số</h3>
 * <ul>
 *   <li><b>Trailer</b>: COMPLETE → trailerComplete; VIEW → watchRatio × trailerViewMax;
 *       CLICK → trailerClick; SKIP → trailerSkip (âm)</li>
 *   <li><b>Booking</b>: mỗi lần PAID/USED → booking</li>
 *   <li><b>Ticket count</b>: min(1, tickets / saturation) × ticketCountMax</li>
 *   <li><b>Review</b>: rating ≥ 4 → rating × highMultiplier; rating &lt; 3 → max(lowCap, rating−3)</li>
 *   <li><b>Wishlist</b>: thêm vào danh sách → wishlist</li>
 * </ul>
 *
 * <p>Cấu hình tất cả trọng số qua {@code app.recommendation.weights.*}
 * trong {@code application.properties} hoặc environment variables.</p>
 */
@RequiredArgsConstructor
public class HybridContentBasedStrategy implements RecommendationStrategy {

    private final SignalWeights weights;
    private final MovieGenreRepository movieGenreRepository;
    private final MovieActorRepository movieActorRepository;

    @Override
    public List<RecommendationCandidate> recommend(RecommendationContext context, List<Movie> candidates) {
        LocalDate recencyCutoff = LocalDate.now().minusMonths(weights.getRecencyMonths());

        return candidates.stream()
                .filter(movie -> !context.watchedMovieIds().contains(movie.getId()))
                .map(movie -> scoreMovie(movie, context, recencyCutoff))
                .filter(candidate -> candidate.getScore() > 0)
                .sorted(Comparator.comparing(RecommendationCandidate::getScore).reversed())
                .toList();
    }

    private RecommendationCandidate scoreMovie(Movie movie, RecommendationContext context, LocalDate recencyCutoff) {
        RecommendationCandidate candidate = new RecommendationCandidate(movie);

        // ── Thể loại yêu thích ──────────────────────────────────────────────
        for (MovieGenre movieGenre : movieGenreRepository.findByMovie(movie)) {
            Double genreScore = context.genreScores().get(movieGenre.getGenre().getId());
            if (genreScore != null && genreScore != 0) {
                candidate.addScore(genreScore,
                        "Thể loại yêu thích: " + movieGenre.getGenre().getName());
            }
        }

        // ── Diễn viên yêu thích (nhân actorMultiplier) ──────────────────────
        for (MovieActor movieActor : movieActorRepository.findByMovie(movie)) {
            Double actorScore = context.actorScores().get(movieActor.getActor().getId());
            if (actorScore != null && actorScore != 0) {
                candidate.addScore(actorScore * weights.getActorMultiplier(),
                        "Diễn viên yêu thích: " + movieActor.getActor().getName());
            }
        }

        // ── Đạo diễn yêu thích (nhân directorMultiplier) ────────────────────
        if (StringUtils.hasText(movie.getDirector())) {
            Double directorScore = context.directorScores().get(movie.getDirector().toLowerCase());
            if (directorScore != null && directorScore != 0) {
                candidate.addScore(directorScore * weights.getDirectorMultiplier(),
                        "Đạo diễn yêu thích: " + movie.getDirector());
            }
        }

        // ── Phim mới ra mắt (recency bonus) ─────────────────────────────────
        if (movie.getReleaseDate() != null && !movie.getReleaseDate().isBefore(recencyCutoff)) {
            candidate.addScore(weights.getRecencyBonus(), "Phim mới ra mắt");
        }

        return candidate;
    }
}
