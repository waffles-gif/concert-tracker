package com.concerttracker.backend.controller;

import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.dto.response.ReviewResponse;
import com.concerttracker.backend.service.ReviewService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Lectura pública de reseñas (detalle de concierto y feed de Actividad reciente).
 * Crear una reseña sigue en POST /api/v1/user-interactions/reviews (requiere token y asistencia YA_FUI).
 */
@RestController
@RequestMapping("/api/v1")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    // Reseñas de un concierto (detalle de concierto en web y mobile)
    @GetMapping("/concerts/{concertId}/reviews")
    public ResponseEntity<PageResponse<ReviewResponse>> findByConcert(
            @PathVariable Long concertId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(reviewService.findByConcert(concertId, pageable));
    }

    // Feed de "Actividad reciente": siempre ordenado de la más nueva a la más antigua
    @GetMapping("/reviews/recent")
    public ResponseEntity<PageResponse<ReviewResponse>> findRecent(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.findRecent(page, size));
    }
}
