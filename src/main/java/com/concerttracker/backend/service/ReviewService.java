package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.dto.response.ReviewResponse;

public interface ReviewService {

    PageResponse<ReviewResponse> findRecent(int page, int size);
}
