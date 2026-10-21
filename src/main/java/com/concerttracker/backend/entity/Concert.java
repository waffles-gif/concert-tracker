package com.concerttracker.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "concerts")
public class Concert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 150)
    private String title;

    @Column(name = "concert_date", nullable = false)
    private LocalDateTime date;

    @Column(precision = 10, scale = 2)
    private BigDecimal ticketPrice;

    @Column(length = 500)
    private String imageUrl;

    // Enlace oficial para comprar entradas (por ejemplo, la página del evento en Ticketmaster)
    @Column(length = 500)
    private String ticketUrl;

    // Id del evento en la API externa de la que se importó (por ejemplo "tm:Z7r9jZ1A7..."); null si es manual
    @Column(unique = true, length = 100)
    private String externalId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "artist_id", nullable = false)
    private Artist artist;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "venue_id", nullable = false)
    private Venue venue;

    protected Concert() {
    }

    public Concert(String title, LocalDateTime date, BigDecimal ticketPrice, String imageUrl,
                   Artist artist, Venue venue) {
        this.title = title;
        this.date = date;
        this.ticketPrice = ticketPrice;
        this.imageUrl = imageUrl;
        this.artist = artist;
        this.venue = venue;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public BigDecimal getTicketPrice() {
        return ticketPrice;
    }

    public void setTicketPrice(BigDecimal ticketPrice) {
        this.ticketPrice = ticketPrice;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getTicketUrl() {
        return ticketUrl;
    }

    public void setTicketUrl(String ticketUrl) {
        this.ticketUrl = ticketUrl;
    }

    // true si es un concierto de ejemplo cargado por DemoDataLoader (su externalId empieza con "demo:")
    public boolean isDemo() {
        return externalId != null && externalId.startsWith("demo:");
    }

    public String getExternalId() {
        return externalId;
    }

    public void setExternalId(String externalId) {
        this.externalId = externalId;
    }

    public Artist getArtist() {
        return artist;
    }

    public void setArtist(Artist artist) {
        this.artist = artist;
    }

    public Venue getVenue() {
        return venue;
    }

    public void setVenue(Venue venue) {
        this.venue = venue;
    }
}
