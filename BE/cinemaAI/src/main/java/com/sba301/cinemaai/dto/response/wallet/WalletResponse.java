package com.sba301.cinemaai.dto.response.wallet;

import com.sba301.cinemaai.entity.Wallet;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class WalletResponse {

    private Long userId;
    private String userEmail;
    private BigDecimal balance;

    public static WalletResponse from(Wallet wallet) {
        return new WalletResponse(
                wallet.getUser().getId(),
                wallet.getUser().getEmail(),
                wallet.getBalance()
        );
    }
}
