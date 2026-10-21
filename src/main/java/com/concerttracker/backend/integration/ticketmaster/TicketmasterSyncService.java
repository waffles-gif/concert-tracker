package com.concerttracker.backend.integration.ticketmaster;

import com.concerttracker.backend.entity.Artist;
import com.concerttracker.backend.entity.Concert;
import com.concerttracker.backend.entity.ConcertZone;
import com.concerttracker.backend.entity.Genre;
import com.concerttracker.backend.entity.Venue;
import com.concerttracker.backend.event.ConcertCreatedEvent;
import com.concerttracker.backend.integration.ticketmaster.TicketmasterDtos.Attraction;
import com.concerttracker.backend.integration.ticketmaster.TicketmasterDtos.Event;
import com.concerttracker.backend.integration.ticketmaster.TicketmasterDtos.Image;
import com.concerttracker.backend.integration.ticketmaster.TicketmasterDtos.PriceRange;
import com.concerttracker.backend.repository.ArtistRepository;
import com.concerttracker.backend.repository.ConcertRepository;
import com.concerttracker.backend.repository.ConcertZoneRepository;
import com.concerttracker.backend.repository.GenreRepository;
import com.concerttracker.backend.repository.VenueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.Resource;
import org.springframework.util.StreamUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Importa y mantiene al día los conciertos de música de Ticketmaster.
 *
 * <p>Es idempotente: cada concierto se identifica por {@code externalId = "tm:<id del evento>"}, así que
 * ejecutarla varias veces actualiza lo existente y solo crea lo nuevo. Los conciertos nuevos publican
 * {@link ConcertCreatedEvent}, igual que cuando un admin los crea a mano (avisa a los seguidores del artista).
 * Ticketmaster no entrega precios por zona (y en Perú casi nunca precios), por eso el precio queda vacío
 * y el concierto guarda el enlace oficial para comprar.
 */
@Service
public class TicketmasterSyncService {

    public record SyncResult(int fetched, int created, int updated, int skipped, int zonesUpdated) {}

    private static final Logger log = LoggerFactory.getLogger(TicketmasterSyncService.class);

    private static final String ID_PREFIX = "tm:";
    private static final String UNKNOWN_VENUE = "Recinto por confirmar";
    private static final LocalTime DEFAULT_TIME = LocalTime.of(20, 0);

    // Géneros de Ticketmaster -> nombre en español. Los que no están aquí se usan tal cual.
    private static final Map<String, String> GENRE_NAMES = Map.of(
            "Dance/Electronic", "Electrónica",
            "World", "Música del mundo",
            "Latin", "Latino",
            "Alternative", "Alternativo",
            "Classical", "Clásica");
    private static final Set<String> IGNORED_GENRES = Set.of("Undefined", "Other");

    private final TicketmasterClient client;
    private final ConcertRepository concertRepository;
    private final ArtistRepository artistRepository;
    private final VenueRepository venueRepository;
    private final GenreRepository genreRepository;
    private final ConcertZoneRepository zoneRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final String defaultCity;
    private final Resource knownZonesFile;

    public TicketmasterSyncService(TicketmasterClient client,
                                   ConcertRepository concertRepository,
                                   ArtistRepository artistRepository,
                                   VenueRepository venueRepository,
                                   GenreRepository genreRepository,
                                   ConcertZoneRepository zoneRepository,
                                   ApplicationEventPublisher eventPublisher,
                                   @Value("${ticketmaster.default-city:Lima}") String defaultCity,
                                   @Value("classpath:ticketmaster-zones.json") Resource knownZonesFile) {
        this.client = client;
        this.concertRepository = concertRepository;
        this.artistRepository = artistRepository;
        this.venueRepository = venueRepository;
        this.genreRepository = genreRepository;
        this.zoneRepository = zoneRepository;
        this.eventPublisher = eventPublisher;
        this.defaultCity = defaultCity;
        this.knownZonesFile = knownZonesFile;
    }

    @Transactional
    public SyncResult sync() {
        var events = client.fetchMusicEvents();

        Map<String, Concert> existing = concertRepository
                .findByExternalIdIn(events.stream().map(e -> ID_PREFIX + e.id()).toList()).stream()
                .collect(Collectors.toMap(Concert::getExternalId, Function.identity()));
        Map<String, Artist> artists = new HashMap<>();
        artistRepository.findAll().forEach(a -> artists.putIfAbsent(key(a.getName()), a));
        Map<String, Venue> venues = new HashMap<>();
        venueRepository.findAll().forEach(v -> venues.putIfAbsent(key(v.getName()), v));

        int created = 0;
        int updated = 0;
        int skipped = 0;
        for (Event event : events) {
            LocalDateTime date = startOf(event);
            if (event.id() == null || event.name() == null || date == null || isCanceled(event)) {
                skipped++;
                continue;
            }

            Concert concert = existing.get(ID_PREFIX + event.id());
            if (concert == null) {
                Artist artist = findOrCreateArtist(event, artists);
                Venue venue = findOrCreateVenue(event, venues);
                concert = new Concert(cut(event.name(), 150), date, priceOf(event), imageOf(event.images()),
                        artist, venue);
                concert.setExternalId(ID_PREFIX + event.id());
                concert.setTicketUrl(cut(event.url(), 500));
                concert = concertRepository.save(concert);
                eventPublisher.publishEvent(new ConcertCreatedEvent(
                        concert.getId(), artist.getId(), venue.getCountry(), venue.getCity()));
                created++;
            } else if (applyChanges(concert, event, date)) {
                updated++;
            }
        }

        int zonesUpdated = applyKnownZones();

        log.info("Sincronización con Ticketmaster: {} eventos, {} nuevos, {} actualizados, {} omitidos, {} con zonas",
                events.size(), created, updated, skipped, zonesUpdated);
        return new SyncResult(events.size(), created, updated, skipped, zonesUpdated);
    }

    // La API de descubrimiento no entrega zonas ni precios. Los que se conocen (por ejemplo, de los flyers
    // oficiales de venta) se guardan en ticketmaster-zones.json y se aplican aquí, por id de evento.
    // Ese archivo es la fuente de verdad de esos conciertos: si cambia un precio, la próxima sincronización lo actualiza.
    private int applyKnownZones() {
        List<Object> entries;
        try (var in = knownZonesFile.getInputStream()) {
            entries = JsonParserFactory.getJsonParser().parseList(StreamUtils.copyToString(in, StandardCharsets.UTF_8));
        } catch (IOException | RuntimeException e) {
            log.warn("No se pudo leer ticketmaster-zones.json: {}", e.getMessage());
            return 0;
        }

        Map<String, Concert> concerts = concertRepository.findByExternalIdIn(entries.stream()
                        .map(entry -> String.valueOf(((Map<?, ?>) entry).get("externalId"))).toList()).stream()
                .collect(Collectors.toMap(Concert::getExternalId, Function.identity()));

        int applied = 0;
        for (Object entry : entries) {
            Map<?, ?> data = (Map<?, ?>) entry;
            Concert concert = concerts.get(String.valueOf(data.get("externalId")));
            if (concert == null) {
                continue; // el concierto todavía no se importó (o ya no existe en Ticketmaster)
            }
            Map<String, BigDecimal> wanted = new LinkedHashMap<>();
            for (Object zone : (List<?>) data.get("zones")) {
                Map<?, ?> z = (Map<?, ?>) zone;
                wanted.put(String.valueOf(z.get("name")), new BigDecimal(String.valueOf(z.get("price"))));
            }
            if (sameZones(concert.getId(), wanted)) {
                continue;
            }
            zoneRepository.deleteByConcertId(concert.getId());
            zoneRepository.saveAll(wanted.entrySet().stream()
                    .map(zone -> ConcertZone.builder().concert(concert).name(zone.getKey()).price(zone.getValue()).build())
                    .toList());
            wanted.values().stream().min(BigDecimal::compareTo).ifPresent(concert::setTicketPrice);
            applied++;
        }
        return applied;
    }

    private boolean sameZones(Long concertId, Map<String, BigDecimal> wanted) {
        var current = zoneRepository.findByConcert_IdOrderByPriceAsc(concertId);
        return current.size() == wanted.size() && current.stream().allMatch(zone ->
                wanted.containsKey(zone.getName()) && wanted.get(zone.getName()).compareTo(zone.getPrice()) == 0);
    }

    // Actualiza lo que Ticketmaster puede haber cambiado (fecha, título, enlace, imagen). true si algo cambió.
    private boolean applyChanges(Concert concert, Event event, LocalDateTime date) {
        boolean changed = false;
        String title = cut(event.name(), 150);
        if (!Objects.equals(concert.getTitle(), title)) {
            concert.setTitle(title);
            changed = true;
        }
        if (!Objects.equals(concert.getDate(), date)) {
            concert.setDate(date);
            changed = true;
        }
        String url = cut(event.url(), 500);
        if (!Objects.equals(concert.getTicketUrl(), url)) {
            concert.setTicketUrl(url);
            changed = true;
        }
        String image = imageOf(event.images());
        if (image != null && !Objects.equals(concert.getImageUrl(), image)) {
            concert.setImageUrl(image);
            changed = true;
        }
        BigDecimal price = priceOf(event);
        if (price != null && concert.getTicketPrice() == null) {
            concert.setTicketPrice(price);
            changed = true;
        }
        return changed;
    }

    private Artist findOrCreateArtist(Event event, Map<String, Artist> artists) {
        Attraction attraction = event.attractions().stream()
                .filter(a -> a.name() != null && !a.name().isBlank())
                .findFirst().orElse(null);
        String name = cut(attraction != null ? attraction.name().trim() : event.name().trim(), 150);

        Genre genre = genreOf(event);
        Artist artist = artists.get(key(name));
        if (artist == null) {
            String image = attraction != null && attraction.images() != null
                    ? imageOf(attraction.images()) : imageOf(event.images());
            artist = new Artist(name, null, null, image);
            if (genre != null) {
                artist.setGenres(new HashSet<>(Set.of(genre)));
            }
            artist = artistRepository.save(artist);
            artists.put(key(name), artist);
        } else if (genre != null && artist.getGenres().isEmpty()) {
            artist.setGenres(new HashSet<>(Set.of(genre)));
            artist = artistRepository.save(artist);
            artists.put(key(name), artist);
        }
        return artist;
    }

    private Venue findOrCreateVenue(Event event, Map<String, Venue> venues) {
        var tmVenue = event.venues().stream().findFirst().orElse(null);
        String name = tmVenue != null && tmVenue.name() != null && !tmVenue.name().isBlank()
                ? cut(tmVenue.name().trim(), 150) : UNKNOWN_VENUE;

        Venue venue = venues.get(key(name));
        if (venue == null) {
            // Ticketmaster casi nunca trae la ciudad de los recintos de Perú: se usa la ciudad por defecto
            String city = tmVenue != null && tmVenue.city() != null && tmVenue.city().name() != null
                    && !tmVenue.city().name().isBlank() ? tmVenue.city().name().trim() : defaultCity;
            String address = tmVenue != null && tmVenue.address() != null ? cut(tmVenue.address().line1(), 255) : null;
            venue = venueRepository.save(new Venue(name, cut(city, 100), countryName(tmVenue), address, null));
            venues.put(key(name), venue);
        }
        return venue;
    }

    private String countryName(TicketmasterDtos.Venue tmVenue) {
        if (tmVenue != null && tmVenue.country() != null && tmVenue.country().countryCode() != null) {
            return Locale.of("", tmVenue.country().countryCode()).getDisplayCountry(Locale.forLanguageTag("es"));
        }
        return Locale.of("", client.getCountryCode()).getDisplayCountry(Locale.forLanguageTag("es"));
    }

    private Genre genreOf(Event event) {
        if (event.classifications() == null) {
            return null;
        }
        return event.classifications().stream()
                .filter(c -> c.genre() != null && c.genre().name() != null)
                .map(c -> c.genre().name())
                .filter(name -> !IGNORED_GENRES.contains(name))
                .findFirst()
                .map(name -> GENRE_NAMES.getOrDefault(name, name))
                .map(name -> genreRepository.findByNameIgnoreCase(name)
                        .orElseGet(() -> genreRepository.save(new Genre(name))))
                .orElse(null);
    }

    private LocalDateTime startOf(Event event) {
        if (event.dates() == null || event.dates().start() == null) {
            return null;
        }
        var start = event.dates().start();
        if (start.dateTBD() || start.localDate() == null) {
            return null;
        }
        try {
            LocalTime time = start.localTime() != null && !start.timeTBA()
                    ? LocalTime.parse(start.localTime()) : DEFAULT_TIME;
            return LocalDate.parse(start.localDate()).atTime(time);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private boolean isCanceled(Event event) {
        String code = event.dates() != null && event.dates().status() != null ? event.dates().status().code() : null;
        return code != null && code.toLowerCase(Locale.ROOT).startsWith("cancel");
    }

    // Solo se usa el precio si Ticketmaster lo da en soles; no se convierten otras monedas
    private BigDecimal priceOf(Event event) {
        if (event.priceRanges() == null) {
            return null;
        }
        return event.priceRanges().stream()
                .filter(range -> "PEN".equalsIgnoreCase(range.currency()) && range.min() != null)
                .map(PriceRange::min)
                .min(BigDecimal::compareTo)
                .orElse(null);
    }

    // La imagen 16:9 más ancha; si no hay, la primera
    private String imageOf(java.util.List<Image> images) {
        if (images == null || images.isEmpty()) {
            return null;
        }
        return cut(images.stream()
                .filter(i -> i.url() != null && "16_9".equals(i.ratio()))
                .max(java.util.Comparator.comparing(i -> i.width() != null ? i.width() : 0))
                .or(() -> images.stream().filter(i -> i.url() != null).findFirst())
                .map(Image::url)
                .orElse(null), 500);
    }

    private String key(String name) {
        return name.trim().toLowerCase(Locale.ROOT);
    }

    private String cut(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
