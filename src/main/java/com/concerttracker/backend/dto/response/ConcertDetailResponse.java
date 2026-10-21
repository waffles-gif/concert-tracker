package com.concerttracker.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ConcertDetailResponse {

    private Long id;
    private String title;
    private LocalDateTime date;
    private BigDecimal ticketPrice;
    private String imageUrl;
    private ArtistResponse artist;
    private VenueResponse venue;
    private List<ZoneResponse> zones;
    private String ticketUrl;
    private boolean demo;

    public ConcertDetailResponse() {
    }

    public ConcertDetailResponse(Long id, String title, LocalDateTime date, BigDecimal ticketPrice,
                                 String imageUrl, ArtistResponse artist, VenueResponse venue,
                                 List<ZoneResponse> zones, String ticketUrl, boolean demo) {
        this.zones = zones;
        this.ticketUrl = ticketUrl;
        this.demo = demo;
        this.id = id;
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

    public LocalDateTime getDate() {
        return date;
    }

    public BigDecimal getTicketPrice() {
        return ticketPrice;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public ArtistResponse getArtist() {
        return artist;
    }

    public VenueResponse getVenue() {
        return venue;
    }

    // true si es un concierto de ejemplo (datos demo), no uno real
    public boolean isDemo() {
        return demo;
    }

    // Enlace para comprar entradas (puede ser null)
    public String getTicketUrl() {
        return ticketUrl;
    }

    // Zonas de entradas ordenadas de la más barata a la más cara (vacío si el concierto no tiene zonas)
    public List<ZoneResponse> getZones() {
        return zones;
    }
}
