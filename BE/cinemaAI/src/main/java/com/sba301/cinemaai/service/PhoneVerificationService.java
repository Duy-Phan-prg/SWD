package com.sba301.cinemaai.service;

import com.sba301.cinemaai.entity.PhoneVerificationToken;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.UserProfile;
import com.sba301.cinemaai.enums.OtpPurpose;
import com.sba301.cinemaai.enums.UserStatus;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.UnauthorizedException;
import com.sba301.cinemaai.repository.PhoneVerificationTokenRepository;
import com.sba301.cinemaai.repository.UserProfileRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PhoneVerificationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final PhoneVerificationTokenRepository phoneVerificationTokenRepository;
    private final UserProfileRepository userProfileRepository;
    private final MailService mailService;

    @Transactional
    public PhoneVerificationToken createPhoneVerificationOtp(User user) {
        if (user.getPhone() == null || user.getPhone().isBlank()) {
            throw new BadRequestException("Phone is required");
        }

        PhoneVerificationToken verificationToken = phoneVerificationTokenRepository.save(
                new PhoneVerificationToken(
                        user,
                        generateOtp(),
                        user.getPhone(),
                        OtpPurpose.PHONE_VERIFICATION,
                        LocalDateTime.now().plusMinutes(10)
                )
        );
        mailService.sendOtp(user.getEmail(), verificationToken.getOtp(), "Phone verification");
        return verificationToken;
    }

    @Transactional
    public PhoneVerificationToken createLoginOtp(String phone) {
        User user = findSingleUserByPhone(phone);
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new UnauthorizedException("User is disabled");
        }
        if (!user.isPhoneVerified()) {
            throw new UnauthorizedException("Phone is not verified");
        }

        PhoneVerificationToken loginToken = phoneVerificationTokenRepository.save(
                new PhoneVerificationToken(
                        user,
                        generateOtp(),
                        phone,
                        OtpPurpose.LOGIN,
                        LocalDateTime.now().plusMinutes(5)
                )
        );
        mailService.sendOtp(user.getEmail(), loginToken.getOtp(), "Login");
        return loginToken;
    }

    @Transactional
    public void verifyPhone(String phone, String otp) {
        PhoneVerificationToken verificationToken = findValidOtp(phone, otp, OtpPurpose.PHONE_VERIFICATION);
        if (!Objects.equals(verificationToken.getUser().getPhone(), verificationToken.getPhone())) {
            throw new BadRequestException("OTP does not match current phone");
        }

        verificationToken.getUser().activatePhone();
        verificationToken.markUsed();
    }

    @Transactional
    public User verifyLoginOtp(String phone, String otp) {
        PhoneVerificationToken verificationToken = findValidOtp(phone, otp, OtpPurpose.LOGIN);
        User user = verificationToken.getUser();
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new UnauthorizedException("User is disabled");
        }
        if (!user.isPhoneVerified()) {
            throw new UnauthorizedException("Phone is not verified");
        }

        verificationToken.markUsed();
        return user;
    }

    private PhoneVerificationToken findValidOtp(String phone, String otp, OtpPurpose purpose) {
        PhoneVerificationToken verificationToken = phoneVerificationTokenRepository
                .findFirstByPhoneAndOtpAndPurposeAndUsedFalseOrderByCreatedAtDesc(phone, otp, purpose)
                .orElseThrow(() -> new BadRequestException("Invalid OTP"));
        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("OTP is expired or already used");
        }
        return verificationToken;
    }

    private User findSingleUserByPhone(String phone) {
        List<UserProfile> profiles = userProfileRepository.findByPhone(phone);
        if (profiles.isEmpty()) {
            throw new BadRequestException("Phone is not registered");
        }
        if (profiles.size() > 1) {
            throw new BadRequestException("Phone is used by multiple accounts");
        }
        return profiles.get(0).getUser();
    }

    private String generateOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }
}
