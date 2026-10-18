package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.response.FollowedArtistResponse;
import com.concerttracker.backend.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse getProfile(Long userId);

    List<FollowedArtistResponse> getFollowedArtists(Long userId);
}
