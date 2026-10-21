package com.concerttracker.backend.exception;

/**
 * Falla al hablar con un servicio externo (por ejemplo la API de Ticketmaster) o falta su configuración.
 */
public class ExternalServiceException extends RuntimeException {

    public ExternalServiceException(String message) {
        super(message);
    }
}
