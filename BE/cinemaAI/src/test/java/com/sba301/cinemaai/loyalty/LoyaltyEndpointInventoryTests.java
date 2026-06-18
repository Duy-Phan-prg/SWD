package com.sba301.cinemaai.loyalty;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class LoyaltyEndpointInventoryTests {

    @Test
    void loyaltyShouldKeepAutomaticEarningAndRemoveManualAdminAdjustment() throws IOException {
        Path sourceRoot = Path.of("src/main/java/com/sba301/cinemaai");
        String publicController = readSource(sourceRoot.resolve("controller/LoyaltyPointController.java"));
        String service = readSource(sourceRoot.resolve("service/LoyaltyPointService.java"));

        assertTrue(publicController.contains("@requestmapping(\"/api/v1/loyalty\")"));
        assertTrue(publicController.contains("@getmapping(\"/me\")"));
        assertTrue(service.contains("addpointsfrombooking"));

        assertFalse(Files.exists(sourceRoot.resolve("controller/AdminLoyaltyController.java")));
        assertFalse(Files.exists(sourceRoot.resolve("dto/request/loyalty/LoyaltyAddRequest.java")));
        assertFalse(service.contains("redeempoints"));
        assertFalse(service.contains("loyaltyaddrequest"));
    }

    private String readSource(Path path) throws IOException {
        return Files.readString(path).toLowerCase();
    }
}
