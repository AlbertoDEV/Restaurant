package com.meson.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.annotation.PostConstruct;

@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SchemaConfiguration {

    private final JdbcTemplate jdbcTemplate;

    public SchemaConfiguration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void createSchema() {
        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS restaurant");
    }
}
