package com.concerttracker.backend.service;

import com.concerttracker.backend.dto.request.LoginRequest;
import com.concerttracker.backend.dto.request.UserRegisterRequest;
import com.concerttracker.backend.dto.response.AuthResponse;
import com.concerttracker.backend.dto.response.UserResponse;
import com.concerttracker.backend.entity.User;
import com.concerttracker.backend.exception.DuplicateResourceException;
import com.concerttracker.backend.exception.UnauthorizedException;
import com.concerttracker.backend.repository.UserRepository;
import com.concerttracker.backend.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public AuthResponse register(UserRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException(
                    "Ya existe una cuenta con el email: " + request.getEmail());
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getCountry(),
                request.getCity()
        );
        User saved = userRepository.save(user);

        return buildAuthResponse(saved);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Email o contraseña incorrectos"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Email o contraseña incorrectos");
        }

        return buildAuthResponse(user);
    }

    @Override
    public AuthResponse refresh(String refreshToken) {
        if (!"refresh".equals(jwtUtil.extractTokenType(refreshToken)) || jwtUtil.isTokenExpired(refreshToken)) {
            throw new UnauthorizedException("Refresh token inválido o expirado");
        }

        String email = jwtUtil.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado"));

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateAccessToken(user);
        String refreshToken = jwtUtil.generateRefreshToken(user);
        return new AuthResponse(accessToken, refreshToken, UserResponse.from(user));
    }
}