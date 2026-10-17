package com.concerttracker.backend.controller;

import com.concerttracker.backend.dto.request.ArtistCreateRequest;
import com.concerttracker.backend.dto.request.ArtistUpdateRequest;
import com.concerttracker.backend.dto.response.ArtistResponse;
import com.concerttracker.backend.dto.response.ConcertResponse;
import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.service.ArtistService;
import com.concerttracker.backend.service.ConcertService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/artists")
public class ArtistController {

    private final ArtistService artistService;
    private final ConcertService concertService;

    public ArtistController(ArtistService artistService, ConcertService concertService) {
        this.artistService = artistService;
        this.concertService = concertService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ArtistResponse>> findAll(
            @RequestParam(required = false) Long genreId,
            @PageableDefault(size = 10, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(artistService.findAll(genreId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArtistResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(artistService.findById(id));
    }

    @GetMapping("/{id}/concerts")
    public ResponseEntity<List<ConcertResponse>> findConcerts(@PathVariable Long id) {
        return ResponseEntity.ok(concertService.findByArtist(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ArtistResponse> create(@Valid @RequestBody ArtistCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(artistService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ArtistResponse> update(
            @PathVariable Long id, @Valid @RequestBody ArtistUpdateRequest request) {
        return ResponseEntity.ok(artistService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        artistService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
