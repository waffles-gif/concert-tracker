package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.request.ConcertCreateRequest;
import com.concerttracker.backend.dto.request.ConcertUpdateRequest;
import com.concerttracker.backend.dto.request.ZoneRequest;
import com.concerttracker.backend.dto.response.ArtistResponse;
import com.concerttracker.backend.dto.response.ConcertDetailResponse;
import com.concerttracker.backend.dto.response.ConcertResponse;
import com.concerttracker.backend.dto.response.GenreResponse;
import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.dto.response.VenueResponse;
import com.concerttracker.backend.dto.response.ZoneResponse;
import com.concerttracker.backend.entity.Artist;
import com.concerttracker.backend.entity.Concert;
import com.concerttracker.backend.entity.ConcertZone;
import com.concerttracker.backend.entity.Venue;
import com.concerttracker.backend.event.ConcertCreatedEvent;
import com.concerttracker.backend.exception.DuplicateResourceException;
import com.concerttracker.backend.exception.ResourceNotFoundException;
import com.concerttracker.backend.repository.ArtistRepository;
import com.concerttracker.backend.repository.ConcertRepository;
import com.concerttracker.backend.repository.ConcertZoneRepository;
import com.concerttracker.backend.repository.ConcertSpecifications;
import com.concerttracker.backend.repository.VenueRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ConcertServiceImpl implements ConcertService {

    private final ConcertRepository concertRepository;
    private final ArtistRepository artistRepository;
    private final VenueRepository venueRepository;
    private final ConcertZoneRepository zoneRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ConcertServiceImpl(ConcertRepository concertRepository,
                              ArtistRepository artistRepository,
                              VenueRepository venueRepository,
                              ConcertZoneRepository zoneRepository,
                              ApplicationEventPublisher eventPublisher) {
        this.concertRepository = concertRepository;
        this.artistRepository = artistRepository;
        this.venueRepository = venueRepository;
        this.zoneRepository = zoneRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public ConcertDetailResponse create(ConcertCreateRequest request) {
        Artist artist = findArtist(request.getArtistId());
        Venue venue = findVenue(request.getVenueId());
        Concert concert = new Concert(request.getTitle(), request.getDate(), request.getTicketPrice(),
                request.getImageUrl(), artist, venue);
        Concert saved = concertRepository.save(concert);
        if (request.getZones() != null && !request.getZones().isEmpty()) {
            replaceZones(saved, request.getZones());
        }
        eventPublisher.publishEvent(new ConcertCreatedEvent(
                saved.getId(), artist.getId(), venue.getCountry(), venue.getCity()));
        return toDetailResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ConcertResponse> findAll(Pageable pageable) {
        return PageResponse.from(concertRepository.findAll(pageable).map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ConcertDetailResponse findById(Long id) {
        return toDetailResponse(findEntityById(id));
    }

    @Override
    @Transactional
    public ConcertDetailResponse update(Long id, ConcertUpdateRequest request) {
        Concert concert = findEntityById(id);
        concert.setTitle(request.getTitle());
        concert.setDate(request.getDate());
        concert.setTicketPrice(request.getTicketPrice());
        concert.setImageUrl(request.getImageUrl());
        concert.setArtist(findArtist(request.getArtistId()));
        concert.setVenue(findVenue(request.getVenueId()));
        if (request.getZones() != null) {
            replaceZones(concert, request.getZones());
        }
        return toDetailResponse(concertRepository.save(concert));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Concert concert = findEntityById(id);
        zoneRepository.deleteByConcertId(id);
        concertRepository.delete(concert);
    }

    // Reemplaza todas las zonas del concierto. Si queda alguna, el precio "desde" del concierto
    // pasa a ser el de la zona más barata.
    private void replaceZones(Concert concert, List<ZoneRequest> zones) {
        Set<String> names = new HashSet<>();
        for (ZoneRequest zone : zones) {
            if (!names.add(zone.name().trim().toLowerCase())) {
                throw new DuplicateResourceException("La zona '" + zone.name().trim() + "' está repetida");
            }
        }
        zoneRepository.deleteByConcertId(concert.getId());
        zoneRepository.saveAll(zones.stream()
                .map(zone -> ConcertZone.builder()
                        .concert(concert)
                        .name(zone.name().trim())
                        .price(zone.price())
                        .build())
                .toList());
        zones.stream().map(ZoneRequest::price).min(Comparator.naturalOrder()).ifPresent(concert::setTicketPrice);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ConcertResponse> search(String artist, String country, String city,
                                                LocalDate date, Boolean upcoming, Pageable pageable) {
        Specification<Concert> spec = Specification.unrestricted();
        if (artist != null && !artist.isBlank()) {
            spec = spec.and(ConcertSpecifications.artistNameContains(artist.trim()));
        }
        if (country != null && !country.isBlank()) {
            spec = spec.and(ConcertSpecifications.countryEquals(country.trim()));
        }
        if (city != null && !city.isBlank()) {
            spec = spec.and(ConcertSpecifications.cityEquals(city.trim()));
        }
        if (date != null) {
            spec = spec.and(ConcertSpecifications.onDate(date));
        }
        if (upcoming != null) {
            spec = spec.and(ConcertSpecifications.upcoming(upcoming));
        }
        return PageResponse.from(concertRepository.findAll(spec, pageable).map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConcertResponse> findByVenue(Long venueId) {
        if (!venueRepository.existsById(venueId)) {
            throw new ResourceNotFoundException("Venue no encontrado con id: " + venueId);
        }
        return concertRepository.findByVenueIdOrderByDateAsc(venueId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConcertResponse> findByArtist(Long artistId) {
        if (!artistRepository.existsById(artistId)) {
            throw new ResourceNotFoundException("Artista no encontrado con id: " + artistId);
        }
        return concertRepository.findByArtistIdOrderByDateAsc(artistId).stream().map(this::toResponse).toList();
    }

    private Concert findEntityById(Long id) {
        return concertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Concierto no encontrado con id: " + id));
    }

    private Artist findArtist(Long id) {
        return artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artista no encontrado con id: " + id));
    }

    private Venue findVenue(Long id) {
        return venueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venue no encontrado con id: " + id));
    }

    private ConcertResponse toResponse(Concert concert) {
        return ConcertResponse.from(concert);
    }

    private ConcertDetailResponse toDetailResponse(Concert concert) {
        Artist artist = concert.getArtist();
        Venue venue = concert.getVenue();
        return new ConcertDetailResponse(concert.getId(), concert.getTitle(), concert.getDate(),
                concert.getTicketPrice(), concert.getImageUrl(),
                new ArtistResponse(artist.getId(), artist.getName(), artist.getCountry(),
                        artist.getDescription(), artist.getImageUrl(), toGenreResponses(artist)),
                new VenueResponse(venue.getId(), venue.getName(), venue.getCity(), venue.getCountry(),
                        venue.getAddress(), venue.getCapacity()),
                zoneRepository.findByConcert_IdOrderByPriceAsc(concert.getId()).stream()
                        .map(zone -> new ZoneResponse(zone.getId(), zone.getName(), zone.getPrice()))
                        .toList(),
                concert.getTicketUrl(), concert.isDemo());
    }

    private List<GenreResponse> toGenreResponses(Artist artist) {
        return artist.getGenres().stream()
                .sorted(Comparator.comparing(genre -> genre.getName().toLowerCase()))
                .map(genre -> new GenreResponse(genre.getId(), genre.getName()))
                .toList();
    }
}
