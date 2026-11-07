package com.concerttracker.backend.integration.ticketmaster;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Sincronización automática. Está apagada por defecto: se activa con {@code ticketmaster.sync.enabled=true}
 * (variable TICKETMASTER_SYNC_ENABLED). Corre al arrancar la aplicación y todos los días a las 3:00 a. m.
 * (configurable con {@code ticketmaster.sync.cron}).
 */
@Component
@ConditionalOnProperty(name = "ticketmaster.sync.enabled", havingValue = "true")
public class TicketmasterSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(TicketmasterSyncScheduler.class);

    private final TicketmasterSyncService syncService;

    public TicketmasterSyncScheduler(TicketmasterSyncService syncService) {
        this.syncService = syncService;
    }

    // En Render el servidor se duerme y a las 3 a. m. normalmente no corre nada, por eso también al arrancar.
    // ApplicationReadyEvent llega después de los ApplicationRunner, así que el DemoDataLoader ya creó
    // los conciertos "hist:" que necesitan las zonas. @Async: no retrasa el arranque.
    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void runOnStartup() {
        run();
    }

    @Scheduled(cron = "${ticketmaster.sync.cron:0 0 3 * * *}")
    public void run() {
        try {
            syncService.sync();
        } catch (RuntimeException e) {
            // Un fallo de la API externa no debe tumbar el hilo del scheduler
            log.warn("La sincronización automática con Ticketmaster falló: {}", e.getMessage());
            applyZonesOnly();
        }
    }

    // Las zonas salen de un archivo nuestro: se aplican aunque Ticketmaster no haya respondido.
    private void applyZonesOnly() {
        try {
            syncService.removeBrokenConcerts();
            int applied = syncService.applyKnownZones();
            log.info("Zonas aplicadas sin Ticketmaster: {} conciertos actualizados", applied);
        } catch (RuntimeException e) {
            log.warn("No se pudieron aplicar las zonas conocidas: {}", e.getMessage());
        }
    }
}
