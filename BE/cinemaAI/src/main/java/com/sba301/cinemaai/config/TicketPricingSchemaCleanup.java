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
        if (!columnExists("ticket_pricing_rules", "seat_type")) {
            execute("alter table ticket_pricing_rules add column seat_type varchar(30)");
        }
        execute("update ticket_pricing_rules set seat_type = 'STANDARD' where seat_type is null");
        execute("delete from ticket_pricing_rules where seat_type = 'COUPLE' and ticket_type <> 'ADULT'");
        if (columnExists("ticket_combos", "senior_count")) {
            execute("alter table ticket_combos drop column senior_count");
        }
    }

    private boolean columnExists(String table, String column) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "select count(*) from information_schema.columns " +
                            "where table_schema = database() and table_name = ? and column_name = ?",
                    Integer.class, table, column);
            return count != null && count > 0;
        } catch (DataAccessException ex) {
            log.warn("Could not check existence of column {}.{}", table, column, ex);
            return false;
        }
    }

    private void execute(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (DataAccessException ex) {
            log.warn("Could not execute ticket pricing schema cleanup SQL: {}", sql, ex);
        }
    }
}
