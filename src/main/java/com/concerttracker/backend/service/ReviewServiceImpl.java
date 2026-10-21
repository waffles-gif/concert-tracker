package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.dto.response.ReviewResponse;
import com.concerttracker.backend.entity.Concert;
import com.concerttracker.backend.entity.Review;
import com.concerttracker.backend.repository.ReviewRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewServiceImpl implements ReviewService {

    static final int MAX_RECENT_SIZE = 50;

    private final ReviewRepository reviewRepository;

    public ReviewServiceImpl(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> findRecent(int page, int size) {
        // El feed siempre va de la más nueva a la más antigua, sin importar lo que pida el cliente.
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_RECENT_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(reviewRepository.findAllBy(pageable).map(this::toResponse));
    }

    private ReviewResponse toResponse(Review review) {
        Concert concert = review.getConcert();
        return new ReviewResponse(
                review.getId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUser().getId(),
                review.getUser().getName(),
                concert.getId(),
                concert.getTitle(),
                concert.getArtist() != null ? concert.getArtist().getName() : null
        );
    }
}
