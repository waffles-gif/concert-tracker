package com.concerttracker.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ConcertCreateRequest {

    @Size(max = 150, message = "El título no puede superar los 150 caracteres")
    private String title;

    @NotNull(message = "La fecha es obligatoria")
    private LocalDateTime date;

    @PositiveOrZero(message = "El precio no puede ser negativo")
    private BigDecimal ticketPrice;

    @Size(max = 500, message = "La URL de la imagen no puede superar los 500 caracteres")
    private String imageUrl;

    @NotNull(message = "El artista es obligatorio")
    private Long artistId;

    @NotNull(message = "El venue es obligatorio")
    private Long venueId;

    // Opcional. Si se envía, ticketPrice pasa a ser el precio de la zona más barata.
    @Valid
    private List<ZoneRequest> zones;

    public ConcertCreateRequest() {
    }

    public List<ZoneRequest> getZones() {
        return zones;
    }

    public void setZones(List<ZoneRequest> zones) {
        this.zones = zones;
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

    public Long getArtistId() {
        return artistId;
    }

    public void setArtistId(Long artistId) {
        this.artistId = artistId;
    }

    public Long getVenueId() {
        return venueId;
    }

    public void setVenueId(Long venueId) {
        this.venueId = venueId;
    }
}
