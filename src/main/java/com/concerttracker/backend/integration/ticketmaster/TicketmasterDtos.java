package com.concerttracker.backend.integration.ticketmaster;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Partes de la respuesta de la Discovery API de Ticketmaster (GET /discovery/v2/events.json) que usamos.
 * Todo lo demás se ignora.
 */
public final class TicketmasterDtos {

    private TicketmasterDtos() {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EventsResponse(@JsonProperty("_embedded") Embedded embedded, Page page) {
        public List<Event> events() {
            return embedded == null || embedded.events() == null ? List.of() : embedded.events();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Embedded(List<Event> events) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Page(int size, int totalElements, int totalPages, int number) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Event(String id, String name, String url, Dates dates, List<Image> images,
                        List<Classification> classifications, List<PriceRange> priceRanges,
                        @JsonProperty("_embedded") EventEmbedded embedded) {

        public List<Venue> venues() {
            return embedded == null || embedded.venues() == null ? List.of() : embedded.venues();
        }

        public List<Attraction> attractions() {
            return embedded == null || embedded.attractions() == null ? List.of() : embedded.attractions();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PriceRange(java.math.BigDecimal min, java.math.BigDecimal max, String currency) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EventEmbedded(List<Venue> venues, List<Attraction> attractions) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Dates(Start start, Status status) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Start(String localDate, String localTime, boolean dateTBD, boolean dateTBA, boolean timeTBA) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Status(String code) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Image(String url, String ratio, Integer width, Integer height) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Classification(NamedValue genre) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record NamedValue(String name) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Venue(String name, NamedValue city, Country country, Address address) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Country(String name, String countryCode) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Address(String line1) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Attraction(String name, List<Image> images) {}
}
