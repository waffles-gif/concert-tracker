package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.request.UserUpdateRequest;
import com.concerttracker.backend.dto.response.FavoriteConcertResponse;
import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.dto.response.UserResponse;
import org.springframework.data.domain.Pageable;

public interface UserService {

    UserResponse getProfile(Long userId);

    UserResponse updateProfile(Long userId, UserUpdateRequest request);

    PageResponse<FavoriteConcertResponse> getFavoriteConcerts(Long userId, Pageable pageable);
}
