package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.request.AttendanceRequestDto;
import com.concerttracker.backend.dto.request.FollowRequestDto;
import com.concerttracker.backend.dto.request.ReviewRequestDto;
import com.concerttracker.backend.dto.request.AttendanceResponseDto;
import com.concerttracker.backend.dto.request.FollowResponseDto;
import com.concerttracker.backend.dto.request.ReviewResponseDto;
import com.concerttracker.backend.dto.response.ConcertInteractionResponse;
import com.concerttracker.backend.dto.response.ConcertResponse;
import com.concerttracker.backend.dto.response.MyConcertResponse;
import com.concerttracker.backend.dto.response.PageResponse;
import com.concerttracker.backend.entity.Artist;
import com.concerttracker.backend.entity.Attendance;
import com.concerttracker.backend.entity.Concert;
import com.concerttracker.backend.entity.FavoriteConcert;
import com.concerttracker.backend.entity.Follow;
import com.concerttracker.backend.entity.Review;
import com.concerttracker.backend.entity.User;
import com.concerttracker.backend.event.AttendanceCreatedEvent;
import com.concerttracker.backend.event.ReviewCreatedEvent;
import com.concerttracker.backend.exception.AttendanceNotAllowedException;
import com.concerttracker.backend.exception.DuplicateResourceException;
import com.concerttracker.backend.exception.InvalidOperationException;
import com.concerttracker.backend.exception.ResourceNotFoundException;
import com.concerttracker.backend.exception.ReviewNotAllowedException;
import com.concerttracker.backend.repository.ArtistRepository;
import com.concerttracker.backend.repository.AttendanceRepository;
import com.concerttracker.backend.repository.ConcertRepository;
import com.concerttracker.backend.repository.FavoriteConcertRepository;
import com.concerttracker.backend.repository.FollowRepository;
import com.concerttracker.backend.repository.ReviewRepository;
import com.concerttracker.backend.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class UserInteractionServiceImpl implements UserInteractionService {

    private final AttendanceRepository attendanceRepository;
    private final ReviewRepository reviewRepository;
    private final FollowRepository followRepository;
    private final ConcertRepository concertRepository;
    private final ArtistRepository artistRepository;
    private final UserRepository userRepository;
    private final FavoriteConcertRepository favoriteConcertRepository;
    private final ApplicationEventPublisher eventPublisher;

    public UserInteractionServiceImpl(AttendanceRepository attendanceRepository,
                                      ReviewRepository reviewRepository,
                                      FollowRepository followRepository,
                                      ConcertRepository concertRepository,
                                      ArtistRepository artistRepository,
                                      UserRepository userRepository,
                                      FavoriteConcertRepository favoriteConcertRepository,
                                      ApplicationEventPublisher eventPublisher) {
        this.attendanceRepository = attendanceRepository;
        this.reviewRepository = reviewRepository;
        this.followRepository = followRepository;
        this.concertRepository = concertRepository;
        this.artistRepository = artistRepository;
        this.userRepository = userRepository;
        this.favoriteConcertRepository = favoriteConcertRepository;
        this.eventPublisher = eventPublisher;
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe un usuario con id " + userId));
    }

    @Override
    @Transactional
    public AttendanceResponseDto setOrUpdateAttendance(Long userId, AttendanceRequestDto dto) {
        Concert concert = concertRepository.findById(dto.concertId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No existe un concierto con id " + dto.concertId()));

        // No tiene sentido decir "ya fui" a un concierto que todavía no ocurre
        if (dto.status() == Attendance.AttendanceStatus.YA_FUI
                && concert.getDate().isAfter(LocalDateTime.now())) {
            throw new AttendanceNotAllowedException(
                    "No puedes marcar 'YA_FUI' en un concierto que aún no se realiza.");
        }

        Attendance attendance = attendanceRepository.findByUser_IdAndConcert_Id(userId, dto.concertId())
                .orElse(Attendance.builder()
                        .user(findUser(userId))
                        .concert(concert)
                        .build());

        attendance.setStatus(dto.status());
        Attendance saved = attendanceRepository.save(attendance);

        eventPublisher.publishEvent(new AttendanceCreatedEvent(userId, dto.concertId(), dto.status().name()));

        return new AttendanceResponseDto(
                saved.getId(),
                saved.getUserId(),
                saved.getConcertId(),
                saved.getStatus(),
                saved.getCreatedAt()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponseDto> getUserHistory(Long userId, Attendance.AttendanceStatus statusFilter) {
        List<Attendance> list = (statusFilter != null)
                ? attendanceRepository.findByUser_IdAndStatus(userId, statusFilter)
                : attendanceRepository.findByUser_Id(userId);

        return list.stream()
                .map(a -> new AttendanceResponseDto(
                        a.getId(),
                        a.getUserId(),
                        a.getConcertId(),
                        a.getStatus(),
                        a.getCreatedAt()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MyConcertResponse> getMyConcerts(Long userId, Attendance.AttendanceStatus statusFilter,
                                                         Pageable pageable) {
        Page<Attendance> page = (statusFilter != null)
                ? attendanceRepository.findByUser_IdAndStatus(userId, statusFilter, pageable)
                : attendanceRepository.findByUser_Id(userId, pageable);

        List<Long> concertIds = page.getContent().stream().map(Attendance::getConcertId).toList();
        Set<Long> reviewed = concertIds.isEmpty()
                ? Set.of()
                : new HashSet<>(reviewRepository.findReviewedConcertIds(userId, concertIds));

        return PageResponse.from(page.map(a -> toMyConcert(a, reviewed.contains(a.getConcertId()))));
    }

    private MyConcertResponse toMyConcert(Attendance attendance, boolean reviewed) {
        return new MyConcertResponse(attendance.getId(), attendance.getStatus(), attendance.getUpdatedAt(),
                reviewed, ConcertResponse.from(attendance.getConcert()));
    }

    @Override
    @Transactional(readOnly = true)
    public ConcertInteractionResponse getConcertInteraction(Long userId, Long concertId) {
        if (!concertRepository.existsById(concertId)) {
            throw new ResourceNotFoundException("No existe un concierto con id " + concertId);
        }
        Attendance.AttendanceStatus status = attendanceRepository.findByUser_IdAndConcert_Id(userId, concertId)
                .map(Attendance::getStatus)
                .orElse(null);
        boolean reviewed = reviewRepository.findByUser_IdAndConcert_Id(userId, concertId).isPresent();
        boolean favorite = favoriteConcertRepository.existsByUser_IdAndConcert_Id(userId, concertId);
        return new ConcertInteractionResponse(status, reviewed, favorite);
    }

    // Idempotente: si ya estaba en favoritos no hace nada
    @Override
    @Transactional
    public void addFavorite(Long userId, Long concertId) {
        Concert concert = concertRepository.findById(concertId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe un concierto con id " + concertId));
        if (!favoriteConcertRepository.existsByUser_IdAndConcert_Id(userId, concertId)) {
            favoriteConcertRepository.save(FavoriteConcert.builder()
                    .user(findUser(userId))
                    .concert(concert)
                    .build());
        }
    }

    // Idempotente: si no estaba en favoritos no hace nada
    @Override
    @Transactional
    public void removeFavorite(Long userId, Long concertId) {
        favoriteConcertRepository.deleteByUser_IdAndConcert_Id(userId, concertId);
    }

    @Override
    @Transactional
    public ReviewResponseDto createReview(Long userId, ReviewRequestDto dto) {
        Concert concert = concertRepository.findById(dto.concertId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe un concierto con id " + dto.concertId()));

        // Regla de negocio: solo se puede reseñar si la asistencia dice YA_FUI
        Attendance attendance = attendanceRepository.findByUser_IdAndConcert_Id(userId, dto.concertId())
                .orElseThrow(() -> new InvalidOperationException(
                        "No puedes dejar una reseña sin haber registrado asistencia previa."));

        if (attendance.getStatus() != Attendance.AttendanceStatus.YA_FUI) {
            throw new ReviewNotAllowedException(
                    "Solo puedes dejar una reseña si el estado de tu asistencia es 'YA_FUI'.");
        }

        if (reviewRepository.findByUser_IdAndConcert_Id(userId, dto.concertId()).isPresent()) {
            throw new DuplicateResourceException("Ya dejaste una reseña para este concierto.");
        }

        Review review = Review.builder()
                .user(findUser(userId))
                .concert(concert)
                .rating(dto.rating())
                .comment(dto.comment())
                .build();

        Review saved = reviewRepository.save(review);

        eventPublisher.publishEvent(new ReviewCreatedEvent(userId, dto.concertId(), dto.rating()));

        return new ReviewResponseDto(
                saved.getId(),
                saved.getUserId(),
                saved.getConcertId(),
                saved.getRating(),
                saved.getComment(),
                saved.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public FollowResponseDto followArtist(Long userId, FollowRequestDto dto) {
        Artist artist = artistRepository.findById(dto.artistId())
                .orElseThrow(() -> new ResourceNotFoundException("No existe un artista con id " + dto.artistId()));

        if (followRepository.existsByUser_IdAndArtist_Id(userId, dto.artistId())) {
            throw new DuplicateResourceException("Ya sigues a este artista.");
        }

        Follow follow = Follow.builder()
                .user(findUser(userId))
                .artist(artist)
                .build();

        Follow saved = followRepository.save(follow);

        return new FollowResponseDto(
                saved.getId(),
                saved.getUserId(),
                saved.getArtistId(),
                saved.getCreatedAt()
        );
    }
}
