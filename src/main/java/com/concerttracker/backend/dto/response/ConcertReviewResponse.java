package com.concerttracker.backend.dto.response;

import java.time.LocalDateTime;

/**
 * Reseña pública de un concierto. Solo expone el nombre del autor (nunca su email).
 */
public record ConcertReviewResponse(
        Long id,
        String userName,
        Integer rating,
        String comment,
        LocalDateTime createdAt
) {}
