package com.concerttracker.backend.repository;

import com.concerttracker.backend.entity.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long>, JpaSpecificationExecutor<Attendance> {

    Optional<Attendance> findByUser_IdAndConcert_Id(Long userId, Long concertId);

    List<Attendance> findByUser_Id(Long userId);

    void deleteByConcert_Id(Long concertId);

    List<Attendance> findByUser_IdAndStatus(Long userId, Attendance.AttendanceStatus status);

    // "Mis conciertos": búsqueda paginada con filtros opcionales (estado, próximos/pasados) que trae
    // concierto, artista y venue en una sola consulta
    @Override
    @EntityGraph(attributePaths = {"concert", "concert.artist", "concert.venue"})
    Page<Attendance> findAll(Specification<Attendance> spec, Pageable pageable);
}
