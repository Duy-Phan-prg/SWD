package com.sba301.cinemaai.service.impl;

import com.sba301.cinemaai.dto.request.user.AdminUserStatusUpdateRequest;
import com.sba301.cinemaai.dto.request.user.AdminStaffCreateRequest;
import com.sba301.cinemaai.dto.request.user.ChangePasswordRequest;
import com.sba301.cinemaai.dto.response.user.UserProfileResponse;
import com.sba301.cinemaai.dto.request.user.UserProfileUpdateRequest;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.UserProfile;
import com.sba301.cinemaai.enums.RoleName;
import com.sba301.cinemaai.enums.UserStatus;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.ConflictException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.mapper.UserMapper;
import com.sba301.cinemaai.repository.UserProfileRepository;
import com.sba301.cinemaai.repository.UserRepository;
import com.sba301.cinemaai.service.UserRoleService;
import com.sba301.cinemaai.service.UserService;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserRoleService userRoleService;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = getByEmail(email);
        return toProfile(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UserProfileUpdateRequest request) {
        User user = getByEmail(email);
        UserProfile profile = user.getProfile();
        profile.setFullName(request.fullName());
        if (!Objects.equals(profile.getPhone(), request.phone())) {
            profile.setPhoneVerified(false);
        }
        profile.setPhone(request.phone());
        user.setBirthYear(request.birthYear());
        return toProfile(user);
    }

    @Transactional
    public UserProfileResponse updateAvatar(String email, String avatarUrl) {
        User user = getByEmail(email);
        user.getProfile().setAvatarUrl(avatarUrl);
        return toProfile(user);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        if (!request.newPassword().equals(request.confirmPassword())) {
            throw new BadRequestException("Confirm password does not match");
        }

        User user = getByEmail(email);
        if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Old password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password must be different from old password");
        }

        user.changePassword(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::toProfile)
                .toList();
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getById(Long id) {
        return toProfile(findById(id));
    }

    @Transactional
    public UserProfileResponse createStaff(AdminStaffCreateRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException("Email already exists");
        }
        if (request.phone() != null && !request.phone().isBlank()
                && userProfileRepository.existsByPhone(request.phone())) {
            throw new ConflictException("Phone already exists");
        }

        User staff = userRepository.save(new User(
                request.email(),
                passwordEncoder.encode(request.password()),
                request.fullName(),
                request.phone(),
                request.birthYear()
        ));
        staff.activateEmail();
        userRoleService.assignRole(staff, RoleName.STAFF);
        return toProfile(staff);
    }

    @Transactional
    public UserProfileResponse updateStatus(Long id, AdminUserStatusUpdateRequest request) {
        User user = findById(id);
        if (request.status() == UserStatus.DISABLED) {
            user.disable();
        } else if (request.status() == UserStatus.ACTIVE) {
            user.activateEmail();
        } else if (request.status() == UserStatus.PENDING_VERIFICATION) {
            throw new BadRequestException("Cannot move user back to pending verification");
        }
        return toProfile(user);
    }

    public UserProfileResponse toProfile(User user) {
        return userMapper.toProfile(user, userRoleService.getRoleNames(user.getId()));
    }

    private User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }
}
