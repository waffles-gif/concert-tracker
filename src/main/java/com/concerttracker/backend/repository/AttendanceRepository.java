package com.concerttracker.backend.repository;

import com.concerttracker.backend.entity.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByUser_IdAndConcert_Id(Long userId, Long concertId);

    List<Attendance> findByUser_Id(Long userId);

    List<Attendance> findByUser_IdAndStatus(Long userId, Attendance.AttendanceStatus status);

    // Versiones paginadas para "Mis conciertos": traen concierto, artista y venue en una sola consulta
    @EntityGraph(attributePaths = {"concert", "concert.artist", "concert.venue"})
    Page<Attendance> findByUser_Id(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"concert", "concert.artist", "concert.venue"})
    Page<Attendance> findByUser_IdAndStatus(Long userId, Attendance.AttendanceStatus status, Pageable pageable);
}
