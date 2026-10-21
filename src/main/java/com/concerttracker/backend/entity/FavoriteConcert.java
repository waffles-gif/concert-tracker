package com.concerttracker.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Concierto que un usuario guardó en sus favoritos (puede ser pasado o próximo).
 */
@Entity
@Table(name = "favorite_concerts", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "concert_id"})
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FavoriteConcert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "concert_id", nullable = false)
    private Concert concert;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
