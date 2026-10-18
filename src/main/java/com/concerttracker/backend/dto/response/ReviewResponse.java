package com.concerttracker.backend.dto.response;

import java.time.LocalDateTime;

/**
 * Reseña pensada para mostrarse en pantalla: incluye el nombre del autor y del concierto
 * para que web y mobile no tengan que hacer peticiones extra.
 */
public record ReviewResponse(
        Long id,
        Integer rating,
        String comment,
        LocalDateTime createdAt,
        Long userId,
        String userName,
        Long concertId,
        String concertTitle,
        String artistName
) {}
