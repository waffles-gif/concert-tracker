package com.concerttracker.backend.integration.ticketmaster;

import com.concerttracker.backend.exception.ExternalServiceException;
import com.concerttracker.backend.integration.ticketmaster.TicketmasterDtos.Event;
import com.concerttracker.backend.integration.ticketmaster.TicketmasterDtos.EventsResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.List;

/**
 * Cliente de la Discovery API de Ticketmaster. La clave viene de {@code ticketmaster.api-key}
 * (application-local.properties o variable TICKETMASTER_API_KEY) y nunca se escribe en logs ni en errores.
 */
@Component
public class TicketmasterClient {

    // La API solo permite paginar mientras size * page < 1000
    private static final int MAX_ITEMS = 1000;
    private static final int PAGE_SIZE = 100;

    private final RestClient restClient;
    private final String apiKey;
    private final String countryCode;

    public TicketmasterClient(@Value("${ticketmaster.api-key:}") String apiKey,
                              @Value("${ticketmaster.base-url:https://app.ticketmaster.com/discovery/v2}") String baseUrl,
                              @Value("${ticketmaster.country-code:PE}") String countryCode) {
        this.apiKey = apiKey;
        this.countryCode = countryCode;
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public String getCountryCode() {
        return countryCode;
    }

    /** Descarga todos los eventos de música del país configurado, ordenados por fecha. */
    public List<Event> fetchMusicEvents() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ExternalServiceException(
                    "Falta configurar la clave de Ticketmaster (ticketmaster.api-key o TICKETMASTER_API_KEY)");
        }

        List<Event> events = new ArrayList<>();
        int page = 0;
        int totalPages = 1;
        while (page < totalPages && page * PAGE_SIZE < MAX_ITEMS) {
            EventsResponse response = fetchPage(page);
            events.addAll(response.events());
            totalPages = response.page() != null ? response.page().totalPages() : 0;
            page++;
        }
        return events;
    }

    private EventsResponse fetchPage(int page) {
        try {
            EventsResponse response = restClient.get()
                    .uri(uri -> uri.path("/events.json")
                            .queryParam("apikey", apiKey)
                            .queryParam("countryCode", countryCode)
                            .queryParam("classificationName", "music")
                            .queryParam("size", PAGE_SIZE)
                            .queryParam("page", page)
                            .queryParam("sort", "date,asc")
                            .build())
                    .retrieve()
                    .body(EventsResponse.class);
            return response != null ? response : new EventsResponse(null, null);
        } catch (RestClientResponseException e) {
            // Solo el código HTTP: el mensaje de la excepción incluye la URL con la clave
            throw new ExternalServiceException(e.getStatusCode().value() == 401
                    ? "Ticketmaster rechazó la clave de API (401). Revisa ticketmaster.api-key"
                    : "Ticketmaster respondió con error " + e.getStatusCode().value());
        } catch (RuntimeException e) {
            throw new ExternalServiceException("No se pudo conectar con Ticketmaster");
        }
    }
}
