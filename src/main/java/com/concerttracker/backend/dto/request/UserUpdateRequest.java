package com.concerttracker.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar los 100 caracteres")
        String name,

        @Size(max = 100, message = "El país no puede superar los 100 caracteres")
        String country,

        @Size(max = 100, message = "La ciudad no puede superar los 100 caracteres")
        String city,

        @Size(max = 300, message = "La bio no puede superar los 300 caracteres")
        String bio
) {}
