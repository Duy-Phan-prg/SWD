package com.sba301.cinemaai.seeder;

import com.sba301.cinemaai.entity.Review;
import com.sba301.cinemaai.entity.Role;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.UserRole;
import com.sba301.cinemaai.enums.RoleName;
import com.sba301.cinemaai.enums.UserStatus;
import com.sba301.cinemaai.repository.MovieRepository;
import com.sba301.cinemaai.repository.ReviewRepository;
import com.sba301.cinemaai.repository.RoleRepository;
import com.sba301.cinemaai.repository.UserRepository;
import com.sba301.cinemaai.repository.UserRoleRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds demo customers with persona-based movie reviews so the collaborative
 * recommender has real signal (each persona has a distinct taste profile).
 * Password for every demo account: Demo@123
 */
@Component
@Order(50)
@RequiredArgsConstructor
public class DemoReviewSeeder implements Seeder {

    private static final String DEMO_PASSWORD = "Demo@123";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final MovieRepository movieRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void seed() {
        seedPersona("demo.scifi@cinemaai.com", "Khoa Sci-Fi", "0911000001", Map.of(
                "Interstellar", r(5, "Tuyệt tác! Xem xong ngồi lặng 10 phút."),
                "Inception", r(5, "Càng xem lại càng thấm, twist đỉnh cao."),
                "The Dark Knight", r(5, "Joker của Heath Ledger là huyền thoại."),
                "Avengers: Endgame", r(4, "Cái kết trọn vẹn cho 10 năm Marvel."),
                "Spider-Man: Into the Spider-Verse", r(4, "Hoạt hình mà chất hơn cả live-action."),
                "The Grand Budapest Hotel", r(3, "Đẹp nhưng không phải gu mình lắm.")
        ));
        seedPersona("demo.romance@cinemaai.com", "Linh Mộng Mơ", "0911000002", Map.of(
                "The Green Mile", r(5, "Khóc hết nước mắt, Tom Hanks diễn quá hay."),
                "The Grand Budapest Hotel", r(4, "Màu phim đẹp mê ly, thoại duyên dáng."),
                "Parasite", r(4, "Ám ảnh nhưng xuất sắc từng khung hình."),
                "The Dark Knight", r(2, "Bạo lực quá, không hợp gu mình."),
                "Interstellar", r(3, "Hơi dài, nhưng đoạn cuối cảm động.")
        ));
        seedPersona("demo.action@cinemaai.com", "Đức Hành Động", "0911000003", Map.of(
                "The Dark Knight", r(5, "Phim siêu anh hùng hay nhất mọi thời đại."),
                "Avengers: Endgame", r(5, "Trận chiến cuối cùng mãn nhãn tuyệt đối."),
                "Black Panther", r(4, "Wakanda forever! Hành động đã mắt."),
                "Inception", r(4, "Hành động kết hợp trí tuệ, quá đã."),
                "The Green Mile", r(3, "Hay nhưng hơi chậm với mình.")
        ));
        seedPersona("demo.drama@cinemaai.com", "Mai Điện Ảnh", "0911000004", Map.of(
                "Parasite", r(5, "Kiệt tác châu Á, xứng đáng mọi giải thưởng."),
                "The Green Mile", r(5, "Câu chuyện nhân văn ám ảnh mãi."),
                "The Grand Budapest Hotel", r(5, "Wes Anderson đỉnh nhất là đây."),
                "Interstellar", r(4, "Khoa học viễn tưởng nhưng đầy cảm xúc."),
                "Avengers: Endgame", r(2, "Giải trí ổn, nghệ thuật thì không.")
        ));
        seedPersona("demo.family@cinemaai.com", "Tuấn Gia Đình", "0911000005", Map.of(
                "Spider-Man: Into the Spider-Verse", r(5, "Cả nhà xem đều mê, hình ảnh sáng tạo."),
                "Avengers: Endgame", r(4, "Đưa con đi xem, cả rạp vỗ tay."),
                "Black Panther", r(4, "Con mình đòi xem lại lần hai."),
                "The Grand Budapest Hotel", r(3, "Người lớn xem thấy hay, trẻ con hơi chán.")
        ));
        seedPersona("demo.cinephile@cinemaai.com", "Hà Cinephile", "0911000006", Map.of(
                "Parasite", r(4, "Bong Joon-ho kể chuyện quá khéo."),
                "Interstellar", r(4, "Nolan và Zimmer, combo không thể sai."),
                "Black Panther", r(3, "Ổn trong mặt bằng Marvel."),
                "Inception", r(5, "Kịch bản chặt chẽ đến từng giây."),
                "The Dark Knight", r(4, "Xem lần thứ n vẫn nổi da gà.")
        ));
    }

    private void seedPersona(String email, String fullName, String phone, Map<String, ReviewSeed> reviews) {
        Role customerRole = roleRepository.findByName(RoleName.CUSTOMER)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.CUSTOMER)));

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User created = new User(email, passwordEncoder.encode(DEMO_PASSWORD), fullName, phone);
                    created.setEmailVerified(true);
                    created.setStatus(UserStatus.ACTIVE);
                    return userRepository.save(created);
                });

        if (!userRoleRepository.existsByUserIdAndRoleId(user.getId(), customerRole.getId())) {
            userRoleRepository.save(new UserRole(user, customerRole));
        }

        reviews.forEach((movieTitle, seed) ->
                movieRepository.findByTitle(movieTitle).ifPresent(movie -> {
                    if (!reviewRepository.existsByUserAndMovie(user, movie)) {
                        reviewRepository.save(new Review(user, movie, null, seed.rating(), seed.comment()));
                    }
                })
        );
    }

    private static ReviewSeed r(int rating, String comment) {
        return new ReviewSeed(rating, comment);
    }

    private record ReviewSeed(int rating, String comment) {
    }
}
