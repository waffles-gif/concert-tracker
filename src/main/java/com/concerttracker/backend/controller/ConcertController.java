package com.concerttracker.backend.controller;

import com.concerttracker.backend.dto.request.ConcertCreateRequest;
import com.concerttracker.backend.dto.request.ConcertUpdateRequest;
import com.concerttracker.backend.dto.response.ConcertDetailResponse;
import com.concerttracker.backend.dto.response.ConcertResponse;
import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.service.ConcertService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/concerts")
public class ConcertController {

    private final ConcertService concertService;

    public ConcertController(ConcertService concertService) {
        this.concertService = concertService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ConcertResponse>> findAll(
            @PageableDefault(size = 10, sort = "date") Pageable pageable) {
        return ResponseEntity.ok(concertService.findAll(pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<ConcertResponse>> search(
            @RequestParam(required = false) String artist,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Boolean upcoming,
            @PageableDefault(size = 10, sort = "date") Pageable pageable) {
        return ResponseEntity.ok(concertService.search(artist, country, city, date, upcoming, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConcertDetailResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(concertService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ConcertDetailResponse> create(@Valid @RequestBody ConcertCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(concertService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ConcertDetailResponse> update(
            @PathVariable Long id, @Valid @RequestBody ConcertUpdateRequest request) {
        return ResponseEntity.ok(concertService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        concertService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
