package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.request.UserUpdateRequest;
import com.concerttracker.backend.dto.response.ConcertResponse;
import com.concerttracker.backend.dto.response.FavoriteConcertResponse;
import com.concerttracker.backend.dto.response.FollowedArtistResponse;
import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.dto.response.ReviewResponse;
import com.concerttracker.backend.dto.response.UserResponse;
import com.concerttracker.backend.entity.Artist;
import com.concerttracker.backend.entity.User;
import com.concerttracker.backend.exception.ResourceNotFoundException;
import com.concerttracker.backend.repository.FavoriteConcertRepository;
import com.concerttracker.backend.repository.FollowRepository;
import com.concerttracker.backend.repository.ReviewRepository;
import com.concerttracker.backend.repository.UserRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final FavoriteConcertRepository favoriteConcertRepository;
    private final FollowRepository followRepository;
    private final ReviewRepository reviewRepository;

    public UserServiceImpl(UserRepository userRepository, FavoriteConcertRepository favoriteConcertRepository,
                           FollowRepository followRepository, ReviewRepository reviewRepository) {
        this.userRepository = userRepository;
        this.favoriteConcertRepository = favoriteConcertRepository;
        this.followRepository = followRepository;
        this.reviewRepository = reviewRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile(Long userId) {
        return UserResponse.from(findUser(userId));
    }

    @Override
    @Transactional
    public UserResponse updateProfile(Long userId, UserUpdateRequest request) {
        User user = findUser(userId);
        user.setName(request.name().trim());
        user.setCountry(blankToNull(request.country()));
        user.setCity(blankToNull(request.city()));
        user.setBio(blankToNull(request.bio()));
        return UserResponse.from(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FavoriteConcertResponse> getFavoriteConcerts(Long userId, Pageable pageable) {
        return PageResponse.from(favoriteConcertRepository.findByUser_Id(userId, pageable)
                .map(favorite -> new FavoriteConcertResponse(favorite.getCreatedAt(),
                        ConcertResponse.from(favorite.getConcert()))));
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

    // Reseñas que dejó el usuario, paginadas (por defecto las más recientes primero)
    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getMyReviews(Long userId, Pageable pageable) {
        return PageResponse.from(reviewRepository.findByUser_Id(userId, pageable).map(review -> new ReviewResponse(
                review.getId(), review.getRating(), review.getComment(), review.getCreatedAt(),
                review.getUser().getId(), review.getUser().getName(),
                review.getConcert().getId(), review.getConcert().getTitle(),
                review.getConcert().getArtist() != null ? review.getConcert().getArtist().getName() : null)));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe un usuario con id " + userId));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
