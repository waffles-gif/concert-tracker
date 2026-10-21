package com.concerttracker.backend.dto.response;

import java.math.BigDecimal;

public record ZoneResponse(Long id, String name, BigDecimal price) {}
