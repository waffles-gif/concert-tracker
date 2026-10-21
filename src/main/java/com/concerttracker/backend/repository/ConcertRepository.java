package com.concerttracker.backend.repository;

import com.concerttracker.backend.entity.Concert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ConcertRepository extends JpaRepository<Concert, Long>, JpaSpecificationExecutor<Concert> {

    List<Concert> findByVenueIdOrderByDateAsc(Long venueId);

    List<Concert> findByArtistIdOrderByDateAsc(Long artistId);

    // Para la sincronización con APIs externas: conciertos ya importados
    List<Concert> findByExternalIdIn(java.util.Collection<String> externalIds);

    boolean existsByVenueId(Long venueId);

    boolean existsByArtistId(Long artistId);
}
