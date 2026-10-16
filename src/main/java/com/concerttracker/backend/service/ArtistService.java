package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.request.ArtistCreateRequest;
import com.concerttracker.backend.dto.request.ArtistUpdateRequest;
import com.concerttracker.backend.dto.response.ArtistResponse;
import com.concerttracker.backend.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface ArtistService {

    ArtistResponse create(ArtistCreateRequest request);

    PageResponse<ArtistResponse> findAll(Long genreId, Pageable pageable);

    ArtistResponse findById(Long id);

    ArtistResponse update(Long id, ArtistUpdateRequest request);

    void delete(Long id);
}
