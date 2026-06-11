package com.sba301.cinemaai.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TicketPricingSchemaCleanup {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void removeSeniorTicketSupport() {
        execute("delete from ticket_pricing_rules where ticket_type = 'SENIOR'");
        execute("alter table ticket_pricing_rules add column if not exists seat_type varchar(30)");
        execute("update ticket_pricing_rules set seat_type = 'STANDARD' where seat_type is null");
        execute("delete from ticket_pricing_rules where seat_type = 'COUPLE' and ticket_type <> 'ADULT'");
        execute("alter table ticket_combos drop column if exists senior_count");
    }

    private void execute(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (DataAccessException ex) {
            log.warn("Could not execute ticket pricing schema cleanup SQL: {}", sql, ex);
        }
    }
}
