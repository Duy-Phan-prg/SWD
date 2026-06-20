package com.sba301.cinemaai.service;

import com.sba301.cinemaai.entity.PasswordResetToken;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.repository.PasswordResetTokenRepository;
import com.sba301.cinemaai.repository.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

public interface PasswordResetService {

        public PasswordResetToken request(String email);

        public void confirm(String email, String otp, String newPassword, String confirmPassword);
}