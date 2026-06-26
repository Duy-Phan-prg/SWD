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
@Order(16)
@RequiredArgsConstructor
public class StaffAccountSeeder implements Seeder {

    private static final String STAFF_EMAIL = "staff@cinemaai.com";
    private static final String STAFF_PASSWORD = "Staff123";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void seed() {
        Role staffRole = roleRepository.findByName(RoleName.STAFF)
                .orElseGet(() -> roleRepository.save(new Role(RoleName.STAFF)));

        User staff = userRepository.findByEmail(STAFF_EMAIL)
                .orElseGet(() -> {
                    User user = new User(
                            STAFF_EMAIL,
                            passwordEncoder.encode(STAFF_PASSWORD),
                            "CinemaAI Staff",
                            "0900000002"
                    );
                    user.setEmailVerified(true);
                    user.setStatus(UserStatus.ACTIVE);
                    return userRepository.save(user);
                });

        if (!staff.isEmailVerified()) {
            staff.setEmailVerified(true);
            staff.setStatus(UserStatus.ACTIVE);
        }

        if (!userRoleRepository.existsByUserIdAndRoleId(staff.getId(), staffRole.getId())) {
            userRoleRepository.save(new UserRole(staff, staffRole));
        }
    }
}
