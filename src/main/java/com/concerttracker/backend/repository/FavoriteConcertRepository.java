package com.concerttracker.backend.repository;

import com.concerttracker.backend.entity.FavoriteConcert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FavoriteConcertRepository extends JpaRepository<FavoriteConcert, Long> {

    boolean existsByUser_IdAndConcert_Id(Long userId, Long concertId);

    void deleteByUser_IdAndConcert_Id(Long userId, Long concertId);

    // Trae concierto, artista y venue en una sola consulta
    @EntityGraph(attributePaths = {"concert", "concert.artist", "concert.venue"})
    Page<FavoriteConcert> findByUser_Id(Long userId, Pageable pageable);
}
