package com.sba301.cinemaai.recommendation;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Hybrid Content-Based Recommendation – configurable signal weights.
 *
 * <p>Mỗi luồng tín hiệu được chuẩn hóa về [0, 1] (hoặc [-1, 1] nếu có chiều âm)
 * rồi nhân với trọng số tương ứng để tạo thành điểm đóng góp vào profile người dùng.</p>
 *
 * <p>Có thể override qua environment variables, ví dụ:
 * {@code APP_RECOMMENDATION_WEIGHTS_BOOKING=5.0}</p>
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.recommendation.weights")
public class SignalWeights {

    // ─── Trailer signals ──────────────────────────────────────────────────────
    /** Điểm khi user xem hết trailer (COMPLETE). */
    private double trailerComplete = 5.0;

    /**
     * Điểm tối đa khi user xem một phần trailer.
     * Điểm thực = watchRatio × trailerViewMax.
     */
    private double trailerViewMax = 5.0;

    /** Điểm khi user bấm vào trailer (CLICK). */
    private double trailerClick = 1.0;

    /** Điểm âm khi user bỏ qua trailer (SKIP). */
    private double trailerSkip = -1.0;

    // ─── Booking signals ──────────────────────────────────────────────────────
    /** Điểm cơ bản cho mỗi lần đặt vé thành công (PAID / USED). */
    private double booking = 4.0;

    /**
     * Điểm thưởng tối đa từ số lượng vé mua.
     * Điểm thực = min(1, tickets / ticketCountSaturation) × ticketCountMax.
     */
    private double ticketCountMax = 1.5;

    /** Số vé tại đó điểm thưởng bão hòa (= ticketCountMax). */
    private int ticketCountSaturation = 6;

    // ─── Review signals ───────────────────────────────────────────────────────
    /**
     * Nhân tử cho review tích cực (rating ≥ 4).
     * Điểm = rating × reviewHighMultiplier.
     */
    private double reviewHighMultiplier = 1.5;

    /**
     * Giới hạn điểm âm cho review tiêu cực (rating < 3).
     * Điểm = max(reviewLowCap, rating – 3).
     */
    private double reviewLowCap = -2.0;

    // ─── Wishlist signals ─────────────────────────────────────────────────────
    /** Điểm khi user thêm phim vào danh sách yêu thích. */
    private double wishlist = 3.0;

    // ─── Movie scoring multipliers ────────────────────────────────────────────
    /**
     * Nhân tử cho điểm đóng góp từ diễn viên yêu thích khi chấm điểm phim.
     * Giá trị > 1.0 ưu tiên diễn viên hơn thể loại.
     */
    private double actorMultiplier = 1.2;

    /**
     * Nhân tử cho điểm đóng góp từ đạo diễn yêu thích khi chấm điểm phim.
     */
    private double directorMultiplier = 1.1;

    /**
     * Điểm thưởng cho phim mới ra mắt (trong vòng {@code recencyMonths} tháng).
     */
    private double recencyBonus = 0.5;

    /** Số tháng tính là "phim mới" cho recency bonus. */
    private int recencyMonths = 6;
}
