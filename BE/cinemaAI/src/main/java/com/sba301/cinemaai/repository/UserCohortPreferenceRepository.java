package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.UserCohortPreference;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserCohortPreferenceRepository extends JpaRepository<UserCohortPreference, Long> {

    Optional<UserCohortPreference> findByCohortKey(String cohortKey);
}
