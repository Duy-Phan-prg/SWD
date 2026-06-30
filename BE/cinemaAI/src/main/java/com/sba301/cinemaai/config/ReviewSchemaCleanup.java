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
public class ReviewSchemaCleanup {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void allowOneReviewPerUsedTicket() {
        execute("alter table reviews drop constraint if exists reviews_user_id_movie_id_key");
        execute("alter table reviews drop constraint if exists uk_reviews_user_movie");
        execute("""
                do $$
                declare
                    constraint_record record;
                begin
                    for constraint_record in
                        select n.nspname, c.conname
                        from pg_constraint c
                        join pg_class t on t.oid = c.conrelid
                        join pg_namespace n on n.oid = t.relnamespace
                        where t.relname = 'reviews'
                          and c.contype = 'u'
                          and (
                              select array_agg(a.attname::text order by a.attname::text)
                              from unnest(c.conkey) key(attnum)
                              join pg_attribute a on a.attrelid = c.conrelid and a.attnum = key.attnum
                          ) = array['movie_id', 'user_id']
                    loop
                        execute format('alter table %I.%I drop constraint %I', constraint_record.nspname, 'reviews', constraint_record.conname);
                    end loop;
                end $$;
                """);
        execute("""
                do $$
                declare
                    index_record record;
                begin
                    for index_record in
                        select schemaname, indexname
                        from pg_indexes
                        where tablename = 'reviews'
                          and indexdef ilike '%unique%'
                          and indexdef ilike '%user_id%'
                          and indexdef ilike '%movie_id%'
                    loop
                        execute format('drop index if exists %I.%I', index_record.schemaname, index_record.indexname);
                    end loop;
                end $$;
                """);
        execute("""
                create unique index if not exists uk_reviews_booking_active
                on reviews(booking_id)
                where booking_id is not null and status <> 'DELETED'
                """);
    }

    private void execute(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (DataAccessException ex) {
            log.warn("Could not execute review schema cleanup SQL: {}", sql, ex);
        }
    }
}
