package com.concerttracker.backend.repository;

import com.concerttracker.backend.entity.ConcertZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConcertZoneRepository extends JpaRepository<ConcertZone, Long> {

    List<ConcertZone> findByConcert_IdOrderByPriceAsc(Long concertId);

    boolean existsByConcert_Id(Long concertId);

    // Borrado inmediato (no diferido): permite volver a insertar zonas con el mismo nombre en la misma transacción
    @Modifying(flushAutomatically = true)
    @Query("delete from ConcertZone z where z.concert.id = :concertId")
    void deleteByConcertId(@Param("concertId") Long concertId);
}
