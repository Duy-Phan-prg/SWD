package com.sba301.cinemaai.seeder;

import com.sba301.cinemaai.entity.Role;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.UserRole;
import com.sba301.cinemaai.enums.RoleName;
import com.sba301.cinemaai.enums.UserStatus;
import com.sba301.cinemaai.repository.RoleRepository;
import com.sba301.cinemaai.repository.UserRepository;
import com.sba301.cinemaai.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(15)
@RequiredArgsConstructor
public class AdminAccountSeeder implements Seeder {

    private static final String ADMIN_EMAIL = "admin@cinemaai.com";
    private static final String ADMIN_PASSWORD = "Admin123";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void seed() {
        Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.ADMIN)));

        User admin = userRepository.findByEmail(ADMIN_EMAIL)
                .orElseGet(() -> {
                    User user = new User(
                            ADMIN_EMAIL,
                            passwordEncoder.encode(ADMIN_PASSWORD),
                            "CinemaAI Admin",
                            "0900000001"
                    );
                    user.setEmailVerified(true);
                    user.setStatus(UserStatus.ACTIVE);
                    return userRepository.save(user);
                });

        if (!admin.isEmailVerified()) {
            admin.setEmailVerified(true);
            admin.setStatus(UserStatus.ACTIVE);
        }

        if (!userRoleRepository.existsByUserIdAndRoleId(admin.getId(), adminRole.getId())) {
            userRoleRepository.save(new UserRole(admin, adminRole));
        }
    }
}
