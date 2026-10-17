package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.request.AttendanceRequestDto;
import com.concerttracker.backend.dto.request.FollowRequestDto;
import com.concerttracker.backend.dto.request.ReviewRequestDto;
import com.concerttracker.backend.dto.request.AttendanceResponseDto;
import com.concerttracker.backend.dto.request.FollowResponseDto;
import com.concerttracker.backend.dto.request.ReviewResponseDto;
import com.concerttracker.backend.entity.Attendance;

import java.util.List;

public interface UserInteractionService {

    AttendanceResponseDto setOrUpdateAttendance(Long userId, AttendanceRequestDto dto);

    List<AttendanceResponseDto> getUserHistory(Long userId, Attendance.AttendanceStatus statusFilter);

    ReviewResponseDto createReview(Long userId, ReviewRequestDto dto);

    FollowResponseDto followArtist(Long userId, FollowRequestDto dto);

    void unfollowArtist(Long userId, Long artistId);
}