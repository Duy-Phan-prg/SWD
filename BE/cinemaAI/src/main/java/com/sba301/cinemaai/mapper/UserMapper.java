package com.sba301.cinemaai.mapper;

import com.sba301.cinemaai.dto.user.UserProfileResponse;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.UserProfile;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserProfileResponse toProfile(User user, List<String> roles) {
        UserProfile profile = user.getProfile();
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                profile.getFullName(),
                profile.getPhone(),
                user.getStatus(),
                user.isEmailVerified(),
                profile.isPhoneVerified(),
                roles,
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}
