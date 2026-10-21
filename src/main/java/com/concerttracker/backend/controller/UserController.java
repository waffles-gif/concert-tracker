package com.concerttracker.backend.controller;

import com.concerttracker.backend.dto.request.UserUpdateRequest;
import com.concerttracker.backend.dto.response.FavoriteConcertResponse;
import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.dto.response.UserResponse;
import com.concerttracker.backend.security.SecurityUtils;
import com.concerttracker.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Perfil del usuario logueado. Todas las rutas requieren token.
 */
@RestController
@RequestMapping("/api/v1/users/me")
public class UserController {

    private final UserService userService;
    private final SecurityUtils securityUtils;

    public UserController(UserService userService, SecurityUtils securityUtils) {
        this.userService = userService;
        this.securityUtils = securityUtils;
    }

    @GetMapping
    public ResponseEntity<UserResponse> getProfile() {
        return ResponseEntity.ok(userService.getProfile(securityUtils.getCurrentUserId()));
    }

    @PutMapping
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(userService.updateProfile(securityUtils.getCurrentUserId(), request));
    }

    // Conciertos que el usuario guardó en favoritos, paginados (los agregados más recientemente primero)
    @GetMapping("/favorite-concerts")
    public ResponseEntity<PageResponse<FavoriteConcertResponse>> getFavoriteConcerts(
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(userService.getFavoriteConcerts(securityUtils.getCurrentUserId(), pageable));
    }
}
