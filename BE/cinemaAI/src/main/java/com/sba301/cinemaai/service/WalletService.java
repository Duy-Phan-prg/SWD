package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.response.wallet.WalletResponse;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.entity.Wallet;
import java.math.BigDecimal;

public interface WalletService {

    WalletResponse getMyWallet(String email);

    Wallet getOrCreate(User user);

    void credit(User user, BigDecimal amount);

    void debit(User user, BigDecimal amount);
}
