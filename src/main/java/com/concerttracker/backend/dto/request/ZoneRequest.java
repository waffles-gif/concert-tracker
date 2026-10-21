package com.concerttracker.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ZoneRequest(
        @NotBlank(message = "El nombre de la zona es obligatorio")
        @Size(max = 60, message = "El nombre de la zona no puede superar los 60 caracteres")
        String name,

        @NotNull(message = "El precio de la zona es obligatorio")
        @PositiveOrZero(message = "El precio de la zona no puede ser negativo")
        BigDecimal price
) {}
