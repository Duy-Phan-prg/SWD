package com.sba301.cinemaai.service.impl;

import com.sba301.cinemaai.dto.response.wallet.WalletResponse;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.Wallet;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.repository.UserRepository;
import com.sba301.cinemaai.repository.WalletRepository;
import com.sba301.cinemaai.service.WalletService;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    @Transactional
    @Override
    public WalletResponse getMyWallet(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("User not found: " + email));
        return WalletResponse.from(getOrCreate(user));
    }

    @Transactional
    @Override
    public Wallet getOrCreate(User user) {
        return walletRepository.findByUser(user)
                .orElseGet(() -> walletRepository.save(new Wallet(user)));
    }

    @Transactional
    @Override
    public void credit(User user, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Credit amount must be positive");
        }
        Wallet wallet = getOrCreate(user);
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
        log.info("Wallet credit {} VND for user {}", amount, user.getEmail());
    }

    @Transactional
    @Override
    public void debit(User user, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Debit amount must be positive");
        }
        Wallet wallet = getOrCreate(user);
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Insufficient wallet balance");
        }
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);
        log.info("Wallet debit {} VND for user {}", amount, user.getEmail());
    }
}
