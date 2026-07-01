package com.sba301.cinemaai.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReviewSchemaCleanup {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void allowOneReviewPerUsedTicket() {
        dropUniqueIndexesOnUserMovieFromReviews();
        createUniqueIndexOnBookingId();
    }

    private void dropUniqueIndexesOnUserMovieFromReviews() {
        try {
            List<String> indexes = jdbcTemplate.queryForList("""
                    SELECT DISTINCT INDEX_NAME
                    FROM information_schema.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'reviews'
                      AND NON_UNIQUE = 0
                      AND INDEX_NAME IN (
                          SELECT INDEX_NAME FROM information_schema.STATISTICS
                          WHERE TABLE_SCHEMA = DATABASE()
                            AND TABLE_NAME = 'reviews'
                            AND COLUMN_NAME = 'user_id'
                      )
                      AND INDEX_NAME IN (
                          SELECT INDEX_NAME FROM information_schema.STATISTICS
                          WHERE TABLE_SCHEMA = DATABASE()
                            AND TABLE_NAME = 'reviews'
                            AND COLUMN_NAME = 'movie_id'
                      )
                      AND INDEX_NAME <> 'PRIMARY'
                    """, String.class);

            for (String indexName : indexes) {
                execute("ALTER TABLE reviews DROP INDEX `" + indexName + "`");
            }
        } catch (DataAccessException ex) {
            log.warn("Could not query review indexes: {}", ex.getMessage());
        }
    }

    private void createUniqueIndexOnBookingId() {
        try {
            Integer count = jdbcTemplate.queryForObject("""
                    SELECT COUNT(*) FROM information_schema.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'reviews'
                      AND INDEX_NAME = 'uk_reviews_booking_active'
                    """, Integer.class);
            if (count == null || count == 0) {
                execute("CREATE UNIQUE INDEX uk_reviews_booking_active ON reviews(booking_id)");
            }
        } catch (DataAccessException ex) {
            log.warn("Could not create review booking index: {}", ex.getMessage());
        }
    }

    private void execute(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (DataAccessException ex) {
            log.warn("Could not execute review schema cleanup SQL: {}\n{}", sql, ex.getMessage());
        }
    }
}
