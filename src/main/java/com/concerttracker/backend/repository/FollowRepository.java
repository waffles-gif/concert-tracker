package com.concerttracker.backend.repository;

import com.concerttracker.backend.entity.Follow;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    Optional<Follow> findByUser_IdAndArtist_Id(Long userId, Long artistId);

    List<Follow> findByUser_Id(Long userId);

    List<Follow> findByArtist_Id(Long artistId);

    boolean existsByUser_IdAndArtist_Id(Long userId, Long artistId);

    // Artistas seguidos con el artista ya cargado, del follow más reciente al más antiguo.
    @EntityGraph(attributePaths = {"artist"})
    List<Follow> findByUser_IdOrderByCreatedAtDesc(Long userId);
}
