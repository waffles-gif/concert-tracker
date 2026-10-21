package com.concerttracker.backend.dto.response;

import com.concerttracker.backend.entity.Attendance.AttendanceStatus;

import java.time.LocalDateTime;

/**
 * Un concierto dentro del historial personal del usuario: su estado de asistencia
 * (VOY_A_IR / YA_FUI), cuándo lo marcó y si ya dejó reseña.
 */
public record MyConcertResponse(
        Long attendanceId,
        AttendanceStatus status,
        LocalDateTime markedAt,
        boolean reviewed,
        ConcertResponse concert
) {}
