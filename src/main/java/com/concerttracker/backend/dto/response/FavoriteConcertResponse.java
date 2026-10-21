package com.concerttracker.backend.dto.response;

import java.time.LocalDateTime;

/**
 * Concierto guardado en los favoritos del usuario y cuándo lo agregó.
 */
public record FavoriteConcertResponse(LocalDateTime addedAt, ConcertResponse concert) {}
