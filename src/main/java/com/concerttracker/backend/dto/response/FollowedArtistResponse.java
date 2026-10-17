package com.concerttracker.backend.dto.response;

import java.time.LocalDateTime;

/**
 * Artista que sigue el usuario logueado, con lo necesario para pintarlo en el perfil.
 */
public record FollowedArtistResponse(
        Long artistId,
        String name,
        String country,
        String imageUrl,
        LocalDateTime followedAt
) {}
