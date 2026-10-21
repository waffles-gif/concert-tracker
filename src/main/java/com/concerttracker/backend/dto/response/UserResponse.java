package com.concerttracker.backend.dto.response;

import com.concerttracker.backend.entity.User;

import java.time.LocalDateTime;

public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String role;
    private String country;
    private String city;
    private String bio;
    private LocalDateTime createdAt;

    public UserResponse() {
    }

    public UserResponse(Long id, String name, String email, String role,
                        String country, String city, String bio, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.country = country;
        this.city = city;
        this.bio = bio;
        this.createdAt = createdAt;
    }

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole().name(),
                user.getCountry(), user.getCity(), user.getBio(), user.getCreatedAt());
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }

    public String getCountry() {
        return country;
    }

    public String getCity() {
        return city;
    }

    public String getBio() {
        return bio;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
