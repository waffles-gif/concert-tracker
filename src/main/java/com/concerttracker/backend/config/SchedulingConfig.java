package com.concerttracker.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Habilita las tareas programadas (@Scheduled), como la sincronización diaria con Ticketmaster.
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
