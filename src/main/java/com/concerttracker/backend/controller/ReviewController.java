package com.concerttracker.backend.controller;

import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.dto.response.ReviewResponse;
import com.concerttracker.backend.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Feed público de reseñas recientes.
 * Las reseñas de un concierto están en GET /api/v1/concerts/{id}/reviews (ConcertController)
 * y crear una reseña sigue en POST /api/v1/user-interactions/reviews.
 */
@RestController
@RequestMapping("/api/v1")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // Feed de "Actividad reciente": siempre ordenado de la más nueva a la más antigua
    @GetMapping("/reviews/recent")
    public ResponseEntity<PageResponse<ReviewResponse>> findRecent(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.findRecent(page, size));
    }
}
