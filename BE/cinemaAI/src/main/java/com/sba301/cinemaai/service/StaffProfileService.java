package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.staff.AdminStaffProfileRequest;
import com.sba301.cinemaai.dto.request.staff.AdminStaffProfileUpdateRequest;
import com.sba301.cinemaai.dto.response.staff.StaffProfileResponse;
import com.sba301.cinemaai.entity.Cinema;
import com.sba301.cinemaai.entity.StaffProfile;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.enums.RoleName;
import com.sba301.cinemaai.enums.StaffStatus;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.ConflictException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.repository.CinemaRepository;
import com.sba301.cinemaai.repository.StaffProfileRepository;
import com.sba301.cinemaai.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StaffProfileService {

    private final StaffProfileRepository staffProfileRepository;
    private final UserRepository userRepository;
    private final CinemaRepository cinemaRepository;
    private final UserRoleService userRoleService;

    @Transactional(readOnly = true)
    public List<StaffProfileResponse> getProfiles(StaffStatus status) {
        List<StaffProfile> profiles = status == null
                ? staffProfileRepository.findAll()
                : staffProfileRepository.findByStatus(status);
        return profiles.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public StaffProfileResponse getProfile(Long profileId) {
        return toResponse(findProfile(profileId));
    }

    @Transactional
    public StaffProfileResponse create(AdminStaffProfileRequest request) {
        User user = findUser(request.userId());
        validateStaffUser(user);
        if (staffProfileRepository.findByUser(user).isPresent()) {
            throw new ConflictException("Staff profile already exists for this user");
        }
        validateEmployeeCodeAvailable(request.employeeCode(), null);

        Cinema cinema = resolveCinema(request.cinemaId());
        StaffProfile profile = new StaffProfile(
                user,
                cinema,
                request.employeeCode().trim(),
                request.position().trim()
        );
        profile.changeStatus(request.status() == null ? StaffStatus.ACTIVE : request.status());
        return toResponse(staffProfileRepository.save(profile));
    }

    @Transactional
    public StaffProfileResponse update(Long profileId, AdminStaffProfileUpdateRequest request) {
        StaffProfile profile = findProfile(profileId);
        validateEmployeeCodeAvailable(request.employeeCode(), profile.getId());
        profile.updateDetails(
                resolveCinema(request.cinemaId()),
                request.employeeCode().trim(),
                request.position().trim()
        );
        if (request.status() != null) {
            profile.changeStatus(request.status());
        }
        return toResponse(profile);
    }

    @Transactional
    public StaffProfileResponse updateStatus(Long profileId, StaffStatus status) {
        StaffProfile profile = findProfile(profileId);
        profile.changeStatus(status);
        return toResponse(profile);
    }

    private void validateStaffUser(User user) {
        boolean isStaff = userRoleService.getRoleNames(user.getId())
                .stream()
                .anyMatch(role -> RoleName.STAFF.name().equals(role));
        if (!isStaff) {
            throw new BadRequestException("Staff profile can only be created for STAFF users");
        }
    }

    private void validateEmployeeCodeAvailable(String employeeCode, Long currentProfileId) {
        staffProfileRepository.findByEmployeeCode(employeeCode.trim())
                .filter(existing -> currentProfileId == null || !existing.getId().equals(currentProfileId))
                .ifPresent(existing -> {
                    throw new ConflictException("Employee code already exists");
                });
    }

    private Cinema resolveCinema(Long cinemaId) {
        if (cinemaId != null) {
            return cinemaRepository.findById(cinemaId)
                    .orElseThrow(() -> new NotFoundException("Cinema not found"));
        }
        return cinemaRepository.findFirstByOrderByIdAsc().orElse(null);
    }

    private StaffProfile findProfile(Long profileId) {
        return staffProfileRepository.findById(profileId)
                .orElseThrow(() -> new NotFoundException("Staff profile not found"));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private StaffProfileResponse toResponse(StaffProfile profile) {
        Cinema cinema = profile.getCinema();
        User user = profile.getUser();
        return new StaffProfileResponse(
                profile.getId(),
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                cinema == null ? null : cinema.getId(),
                cinema == null ? null : cinema.getName(),
                profile.getEmployeeCode(),
                profile.getPosition(),
                profile.getStatus(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }
}
