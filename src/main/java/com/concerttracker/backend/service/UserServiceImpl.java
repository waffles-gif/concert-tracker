package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.response.FollowedArtistResponse;
import com.concerttracker.backend.dto.response.UserResponse;
import com.concerttracker.backend.entity.Artist;
import com.concerttracker.backend.entity.User;
import com.concerttracker.backend.exception.ResourceNotFoundException;
import com.concerttracker.backend.repository.FollowRepository;
import com.concerttracker.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;

    public UserServiceImpl(UserRepository userRepository, FollowRepository followRepository) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe un usuario con id " + userId));
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole().name(),
                user.getCountry(), user.getCity(), user.getCreatedAt());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FollowedArtistResponse> getFollowedArtists(Long userId) {
        return followRepository.findByUser_IdOrderByCreatedAtDesc(userId).stream()
                .map(follow -> {
                    Artist artist = follow.getArtist();
                    return new FollowedArtistResponse(artist.getId(), artist.getName(), artist.getCountry(),
                            artist.getImageUrl(), follow.getCreatedAt());
                })
                .toList();
    }
}
