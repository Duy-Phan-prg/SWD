package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.Wallet;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletRepository extends JpaRepository<Wallet, Long> {

    Optional<Wallet> findByUser(User user);
}
