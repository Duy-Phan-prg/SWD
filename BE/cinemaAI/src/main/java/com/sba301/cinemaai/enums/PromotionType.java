package com.sba301.cinemaai.enums;

import java.math.BigDecimal;
import java.math.RoundingMode;

public enum PromotionType {

    PERCENTAGE {
        @Override
        public BigDecimal calculate(BigDecimal subtotal, BigDecimal value) {
            return subtotal.multiply(value)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
    },
    FIXED_AMOUNT {
        @Override
        public BigDecimal calculate(BigDecimal subtotal, BigDecimal value) {
            return value;
        }
    },
    COMBO {
        @Override
        public BigDecimal calculate(BigDecimal subtotal, BigDecimal value) {
            return value; // treat as FIXED_AMOUNT for now
        }
    };

    public abstract BigDecimal calculate(BigDecimal subtotal, BigDecimal value);
}