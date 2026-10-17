package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.request.ConcertCreateRequest;
import com.concerttracker.backend.dto.request.ConcertUpdateRequest;
import com.concerttracker.backend.dto.response.ArtistResponse;
import com.concerttracker.backend.dto.response.ConcertDetailResponse;
import com.concerttracker.backend.dto.response.ConcertResponse;
import com.concerttracker.backend.dto.response.GenreResponse;
import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.dto.response.VenueResponse;
import com.concerttracker.backend.entity.Artist;
import com.concerttracker.backend.entity.Concert;
import com.concerttracker.backend.entity.Venue;
import com.concerttracker.backend.event.ConcertCreatedEvent;
import com.concerttracker.backend.exception.ResourceNotFoundException;
import com.concerttracker.backend.repository.ArtistRepository;
import com.concerttracker.backend.repository.ConcertRepository;
import com.concerttracker.backend.repository.ConcertSpecifications;
import com.concerttracker.backend.repository.VenueRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class ConcertServiceImpl implements ConcertService {

    private final ConcertRepository concertRepository;
    private final ArtistRepository artistRepository;
    private final VenueRepository venueRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ConcertServiceImpl(ConcertRepository concertRepository,
                              ArtistRepository artistRepository,
                              VenueRepository venueRepository,
                              ApplicationEventPublisher eventPublisher) {
        this.concertRepository = concertRepository;
        this.artistRepository = artistRepository;
        this.venueRepository = venueRepository;
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
        return toDetailResponse(concertRepository.save(concert));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        concertRepository.delete(findEntityById(id));
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
        Artist artist = concert.getArtist();
        Venue venue = concert.getVenue();
        return new ConcertResponse(concert.getId(), concert.getTitle(), concert.getDate(),
                concert.getTicketPrice(), concert.getImageUrl(),
                artist.getId(), artist.getName(), venue.getId(), venue.getName(),
                venue.getCity(), venue.getCountry());
    }

    private ConcertDetailResponse toDetailResponse(Concert concert) {
        Artist artist = concert.getArtist();
        Venue venue = concert.getVenue();
        return new ConcertDetailResponse(concert.getId(), concert.getTitle(), concert.getDate(),
                concert.getTicketPrice(), concert.getImageUrl(),
                new ArtistResponse(artist.getId(), artist.getName(), artist.getCountry(),
                        artist.getDescription(), artist.getImageUrl(), toGenreResponses(artist)),
                new VenueResponse(venue.getId(), venue.getName(), venue.getCity(), venue.getCountry(),
                        venue.getAddress(), venue.getCapacity()));
    }

    private List<GenreResponse> toGenreResponses(Artist artist) {
        return artist.getGenres().stream()
                .sorted(Comparator.comparing(genre -> genre.getName().toLowerCase()))
                .map(genre -> new GenreResponse(genre.getId(), genre.getName()))
                .toList();
    }
}
