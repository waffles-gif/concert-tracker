package com.concerttracker.backend.controller;

import com.concerttracker.backend.dto.request.AttendanceRequestDto;
import com.concerttracker.backend.dto.request.FollowRequestDto;
import com.concerttracker.backend.dto.request.ReviewRequestDto;
import com.concerttracker.backend.dto.request.AttendanceResponseDto;
import com.concerttracker.backend.dto.request.FollowResponseDto;
import com.concerttracker.backend.dto.request.ReviewResponseDto;
import com.concerttracker.backend.dto.response.ConcertInteractionResponse;
import com.concerttracker.backend.dto.response.MyConcertResponse;
import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.entity.Attendance;
import com.concerttracker.backend.security.SecurityUtils;
import com.concerttracker.backend.service.UserInteractionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/user-interactions")
public class UserInteractionController {

    private final UserInteractionService userInteractionService;
    private final SecurityUtils securityUtils;

    public UserInteractionController(UserInteractionService userInteractionService,
                                     SecurityUtils securityUtils) {
        this.userInteractionService = userInteractionService;
        this.securityUtils = securityUtils;
    }

    // Endpoint 1: Registrar o cambiar estado de asistencia (VOY_A_IR / YA_FUI)
    @PostMapping("/attendance")
    public ResponseEntity<AttendanceResponseDto> setAttendance(@Valid @RequestBody AttendanceRequestDto dto) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userInteractionService.setOrUpdateAttendance(userId, dto));
    }

    // Endpoint 2: Historial personal (filtrar por estado VOY_A_IR / YA_FUI opcional)
    @GetMapping("/attendance/history")
    public ResponseEntity<List<AttendanceResponseDto>> getUserHistory(
            @RequestParam(required = false) Attendance.AttendanceStatus status) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(userInteractionService.getUserHistory(userId, status));
    }

    // Historial personal con los datos del concierto, paginado ("Mis conciertos").
    // Filtro opcional por estado; se ordena por fecha del concierto (sort=concert.date,asc|desc).
    @GetMapping("/my-concerts")
    public ResponseEntity<PageResponse<MyConcertResponse>> getMyConcerts(
            @RequestParam(required = false) Attendance.AttendanceStatus status,
            @PageableDefault(size = 10, sort = "concert.date") Pageable pageable) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(userInteractionService.getMyConcerts(userId, status, pageable));
    }

    // Mi estado frente a un concierto: asistencia (o null si no marqué nada) y si ya dejé reseña
    @GetMapping("/concerts/{concertId}")
    public ResponseEntity<ConcertInteractionResponse> getConcertInteraction(@PathVariable Long concertId) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(userInteractionService.getConcertInteraction(userId, concertId));
    }

    // Agregar un concierto a mis favoritos (idempotente)
    @PutMapping("/favorites/{concertId}")
    public ResponseEntity<Void> addFavorite(@PathVariable Long concertId) {
        userInteractionService.addFavorite(securityUtils.getCurrentUserId(), concertId);
        return ResponseEntity.noContent().build();
    }

    // Quitar un concierto de mis favoritos (idempotente)
    @DeleteMapping("/favorites/{concertId}")
    public ResponseEntity<Void> removeFavorite(@PathVariable Long concertId) {
        userInteractionService.removeFavorite(securityUtils.getCurrentUserId(), concertId);
        return ResponseEntity.noContent().build();
    }

    // Endpoint 3: Crear reseña (la validación YA_FUI se ejecuta en el Service)
    @PostMapping("/reviews")
    public ResponseEntity<ReviewResponseDto> createReview(@Valid @RequestBody ReviewRequestDto dto) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userInteractionService.createReview(userId, dto));
    }

    // Endpoint 4: Seguir a un artista
    @PostMapping("/follow")
    public ResponseEntity<FollowResponseDto> followArtist(@Valid @RequestBody FollowRequestDto dto) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userInteractionService.followArtist(userId, dto));
    }
}
