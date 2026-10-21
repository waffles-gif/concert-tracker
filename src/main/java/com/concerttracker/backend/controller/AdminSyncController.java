package com.concerttracker.backend.controller;

import com.concerttracker.backend.integration.ticketmaster.TicketmasterSyncService;
import com.concerttracker.backend.integration.ticketmaster.TicketmasterSyncService.SyncResult;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/sync")
public class AdminSyncController {

    private final TicketmasterSyncService ticketmasterSyncService;

    public AdminSyncController(TicketmasterSyncService ticketmasterSyncService) {
        this.ticketmasterSyncService = ticketmasterSyncService;
    }

    // Importa/actualiza los conciertos de música desde Ticketmaster. Idempotente. Solo ADMIN.
    @PostMapping("/ticketmaster")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SyncResult> syncTicketmaster() {
        return ResponseEntity.ok(ticketmasterSyncService.sync());
    }
}
