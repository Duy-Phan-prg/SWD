package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.UserPreferenceProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserPreferenceProfileRepository extends JpaRepository<UserPreferenceProfile, Long> {

    Optional<UserPreferenceProfile> findByUser(User user);
}
