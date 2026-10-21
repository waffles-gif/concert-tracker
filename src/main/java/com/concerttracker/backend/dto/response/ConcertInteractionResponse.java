package com.concerttracker.backend.dto.response;

import com.concerttracker.backend.entity.Attendance.AttendanceStatus;

/**
 * Cómo se relaciona el usuario logueado con un concierto: su asistencia (null si no marcó nada),
 * si ya dejó reseña y si lo tiene en favoritos.
 */
public record ConcertInteractionResponse(AttendanceStatus attendanceStatus, boolean reviewed, boolean favorite) {}
