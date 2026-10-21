package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.request.ConcertCreateRequest;
import com.concerttracker.backend.dto.request.ConcertUpdateRequest;
import com.concerttracker.backend.dto.response.ConcertDetailResponse;
import com.concerttracker.backend.dto.response.ConcertResponse;
import com.concerttracker.backend.dto.response.ConcertReviewResponse;
import com.concerttracker.backend.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface ConcertService {

    ConcertDetailResponse create(ConcertCreateRequest request);

    PageResponse<ConcertResponse> findAll(Pageable pageable);

    ConcertDetailResponse findById(Long id);

    ConcertDetailResponse update(Long id, ConcertUpdateRequest request);

    void delete(Long id);

    PageResponse<ConcertResponse> search(String artist, String country, String city, LocalDate date,
                                         Boolean upcoming, Pageable pageable);

    PageResponse<ConcertReviewResponse> findReviews(Long concertId, Pageable pageable);

    List<ConcertResponse> findByVenue(Long venueId);

    List<ConcertResponse> findByArtist(Long artistId);
}
