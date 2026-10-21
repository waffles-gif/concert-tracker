package com.concerttracker.backend.integration.ticketmaster;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Sincronización automática. Está apagada por defecto: se activa con {@code ticketmaster.sync.enabled=true}
 * (variable TICKETMASTER_SYNC_ENABLED) y corre todos los días a las 3:00 a. m. (configurable con
 * {@code ticketmaster.sync.cron}).
 */
@Component
@ConditionalOnProperty(name = "ticketmaster.sync.enabled", havingValue = "true")
public class TicketmasterSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(TicketmasterSyncScheduler.class);

    private final TicketmasterSyncService syncService;

    public TicketmasterSyncScheduler(TicketmasterSyncService syncService) {
        this.syncService = syncService;
    }

    @Scheduled(cron = "${ticketmaster.sync.cron:0 0 3 * * *}")
    public void run() {
        try {
            syncService.sync();
        } catch (RuntimeException e) {
            // Un fallo de la API externa no debe tumbar el hilo del scheduler
            log.warn("La sincronización automática con Ticketmaster falló: {}", e.getMessage());
        }
    }
}
