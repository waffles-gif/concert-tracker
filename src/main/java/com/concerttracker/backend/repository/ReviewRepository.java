package com.concerttracker.backend.repository;

import com.concerttracker.backend.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByUser_IdAndConcert_Id(Long userId, Long concertId);

    List<Review> findByConcert_Id(Long concertId);

    // Trae el usuario junto con la reseña para no hacer una consulta extra por cada fila
    @EntityGraph(attributePaths = "user")
    Page<Review> findByConcert_Id(Long concertId, Pageable pageable);

    List<Review> findByUser_Id(Long userId);

    // Feed de reseñas recientes de todos los conciertos (trae usuario, concierto y artista en la misma consulta)
    @EntityGraph(attributePaths = {"user", "concert", "concert.artist"})
    Page<Review> findAllBy(Pageable pageable);

    // Ids de los conciertos (dentro de `concertIds`) que el usuario ya reseñó
    @Query("select r.concert.id from Review r where r.user.id = :userId and r.concert.id in :concertIds")
    List<Long> findReviewedConcertIds(@Param("userId") Long userId, @Param("concertIds") Collection<Long> concertIds);
}
