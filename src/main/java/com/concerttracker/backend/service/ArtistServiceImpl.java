package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.request.ArtistCreateRequest;
import com.concerttracker.backend.dto.request.ArtistUpdateRequest;
import com.concerttracker.backend.dto.response.ArtistResponse;
import com.concerttracker.backend.dto.response.GenreResponse;
import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.entity.Artist;
import com.concerttracker.backend.entity.Genre;
import com.concerttracker.backend.exception.DuplicateResourceException;
import com.concerttracker.backend.exception.ResourceInUseException;
import com.concerttracker.backend.exception.ResourceNotFoundException;
import com.concerttracker.backend.repository.ArtistRepository;
import com.concerttracker.backend.repository.ConcertRepository;
import com.concerttracker.backend.repository.GenreRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ArtistServiceImpl implements ArtistService {

    private final ArtistRepository artistRepository;
    private final ConcertRepository concertRepository;
    private final GenreRepository genreRepository;

    public ArtistServiceImpl(ArtistRepository artistRepository, ConcertRepository concertRepository,
                             GenreRepository genreRepository) {
        this.artistRepository = artistRepository;
        this.concertRepository = concertRepository;
        this.genreRepository = genreRepository;
    }

    @Override
    @Transactional
    public ArtistResponse create(ArtistCreateRequest request) {
        if (artistRepository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateResourceException("Ya existe un artista con el nombre: " + request.getName());
        }
        Artist artist = new Artist(request.getName(), request.getCountry(),
                request.getDescription(), request.getImageUrl());
        artist.setGenres(resolveGenres(request.getGenreIds()));
        return toResponse(artistRepository.save(artist));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ArtistResponse> findAll(Long genreId, Pageable pageable) {
        Page<Artist> artists = genreId == null
                ? artistRepository.findAll(pageable)
                : artistRepository.findByGenres_Id(genreId, pageable);
        return PageResponse.from(artists.map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public ArtistResponse findById(Long id) {
        return toResponse(findEntityById(id));
    }

    @Override
    @Transactional
    public ArtistResponse update(Long id, ArtistUpdateRequest request) {
        Artist artist = findEntityById(id);
        if (artistRepository.existsByNameIgnoreCaseAndIdNot(request.getName(), id)) {
            throw new DuplicateResourceException("Ya existe un artista con el nombre: " + request.getName());
        }
        artist.setName(request.getName());
        artist.setCountry(request.getCountry());
        artist.setDescription(request.getDescription());
        artist.setImageUrl(request.getImageUrl());
        artist.setGenres(resolveGenres(request.getGenreIds()));
        return toResponse(artistRepository.save(artist));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Artist artist = findEntityById(id);
        if (concertRepository.existsByArtistId(id)) {
            throw new ResourceInUseException(
                    "No se puede eliminar el artista con id " + id + " porque tiene conciertos asociados");
        }
        artistRepository.delete(artist);
    }

    private Artist findEntityById(Long id) {
        return artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artista no encontrado con id: " + id));
    }

    private Set<Genre> resolveGenres(Set<Long> genreIds) {
        if (genreIds == null || genreIds.isEmpty()) {
            return new HashSet<>();
        }
        List<Genre> found = genreRepository.findAllById(genreIds);
        if (found.size() != genreIds.size()) {
            throw new ResourceNotFoundException("Uno o más géneros no existen: " + genreIds);
        }
        return new HashSet<>(found);
    }

    private ArtistResponse toResponse(Artist artist) {
        List<GenreResponse> genres = artist.getGenres().stream()
                .sorted(Comparator.comparing(genre -> genre.getName().toLowerCase()))
                .map(genre -> new GenreResponse(genre.getId(), genre.getName()))
                .toList();
        return new ArtistResponse(artist.getId(), artist.getName(), artist.getCountry(),
                artist.getDescription(), artist.getImageUrl(), genres);
    }
}
