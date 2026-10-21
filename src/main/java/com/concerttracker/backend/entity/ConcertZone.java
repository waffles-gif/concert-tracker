package com.concerttracker.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Zona de entradas de un concierto (por ejemplo "Campo VIP", "Tribuna General") con su precio.
 * El precio "desde" del concierto es el de su zona más barata.
 */
@Entity
@Table(name = "concert_zones", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"concert_id", "name"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ConcertZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "concert_id", nullable = false)
    private Concert concert;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
}
