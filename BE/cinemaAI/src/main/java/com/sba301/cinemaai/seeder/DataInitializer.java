package com.sba301.cinemaai.seeder;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final List<Seeder> seeders;

    @Override
    public void run(String... args) {
        seeders.forEach(Seeder::seed);
    }
}
