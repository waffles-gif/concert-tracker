package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.dto.response.ReviewResponse;
import org.springframework.data.domain.Pageable;

public interface ReviewService {

    PageResponse<ReviewResponse> findByConcert(Long concertId, Pageable pageable);

    PageResponse<ReviewResponse> findRecent(int page, int size);
}
