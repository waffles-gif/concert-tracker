package com.concerttracker.backend.controller;

import com.concerttracker.backend.dto.response.FollowedArtistResponse;
import com.concerttracker.backend.dto.response.UserResponse;
import com.concerttracker.backend.security.SecurityUtils;
import com.concerttracker.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Datos del usuario logueado. El usuario sale del JWT, nunca de un id en la URL.
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
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(userService.getProfile(securityUtils.getCurrentUserId()));
    }

    @GetMapping("/follows")
    public ResponseEntity<List<FollowedArtistResponse>> myFollows() {
        return ResponseEntity.ok(userService.getFollowedArtists(securityUtils.getCurrentUserId()));
    }
}
