package com.concerttracker.backend.config;

import com.concerttracker.backend.entity.Artist;
import com.concerttracker.backend.entity.Attendance;
import com.concerttracker.backend.entity.Attendance.AttendanceStatus;
import com.concerttracker.backend.entity.Concert;
import com.concerttracker.backend.entity.FavoriteConcert;
import com.concerttracker.backend.entity.Genre;
import com.concerttracker.backend.entity.Review;
import com.concerttracker.backend.entity.User;
import com.concerttracker.backend.entity.Venue;
import com.concerttracker.backend.repository.ArtistRepository;
import com.concerttracker.backend.repository.AttendanceRepository;
import com.concerttracker.backend.repository.ConcertRepository;
import com.concerttracker.backend.repository.FavoriteConcertRepository;
import com.concerttracker.backend.repository.GenreRepository;
import com.concerttracker.backend.repository.ReviewRepository;
import com.concerttracker.backend.repository.UserRepository;
import com.concerttracker.backend.repository.VenueRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.core.io.Resource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Carga datos de ejemplo para desarrollo y para la presentación (solo con app.demo-data.enabled=true).
 * Es idempotente: se puede ejecutar varias veces sin duplicar nada.
 *
 * <ul>
 *   <li>Artistas y géneros de ejemplo (para el onboarding).</li>
 *   <li>Conciertos pasados REALES de Lima, leídos de {@code past-concerts.json} (agregar uno nuevo es agregar
 *       una entrada a ese archivo). Los próximos vienen de Ticketmaster, no se inventan.</li>
 *   <li>Usuarios de ejemplo con asistencias, reseñas "al azar" y favoritos, para que se vea actividad.
 *       Estas reseñas son datos de ejemplo, no opiniones reales.</li>
 * </ul>
 * No publica eventos, por lo que no envía correos.
 */
@Component
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
public class DemoDataLoader implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataLoader.class);

    private static final String DEMO_EMAIL = "demo@concerttracker.com";
    private static final String PAST_PREFIX = "hist:";
    private static final String TICKETMASTER_PREFIX = "tm:";

    private record ArtistSeed(String name, String country, String description, List<String> genres) {}

    private record UserSeed(String name, String email, String city) {}

    private static final List<String> GENRES = List.of("Reggaeton", "Rock", "Pop", "Indie", "Cumbia");

    private static final List<ArtistSeed> ARTISTS = List.of(
            new ArtistSeed("Bad Bunny", "Puerto Rico", "Artista de reggaeton y trap latino.", List.of("Reggaeton")),
            new ArtistSeed("The Strokes", "Estados Unidos", "Banda neoyorquina de rock e indie.", List.of("Rock", "Indie")),
            new ArtistSeed("Karol G", "Colombia", "Cantante colombiana de reggaeton y pop urbano.", List.of("Reggaeton", "Pop")),
            new ArtistSeed("Feid", "Colombia", "Cantante y productor de reggaeton de Medellín.", List.of("Reggaeton")),
            new ArtistSeed("Shakira", "Colombia", "Estrella del pop latino.", List.of("Pop")),
            new ArtistSeed("Coldplay", "Reino Unido", "Banda británica de rock y pop.", List.of("Rock", "Pop")),
            new ArtistSeed("Arctic Monkeys", "Reino Unido", "Banda de rock alternativo e indie de Sheffield.", List.of("Rock", "Indie")),
            new ArtistSeed("Gian Marco", "Perú", "Cantautor peruano de pop.", List.of("Pop")),
            new ArtistSeed("Pedro Suárez-Vértiz", "Perú", "Referente del rock peruano.", List.of("Rock")),
            new ArtistSeed("Los Mirlos", "Perú", "Agrupación peruana de cumbia amazónica.", List.of("Cumbia")),
            new ArtistSeed("Tini", "Argentina", "Cantante argentina de pop latino.", List.of("Pop")),
            new ArtistSeed("Dua Lipa", "Reino Unido", "Cantante británica de pop.", List.of("Pop")));

    private static final UserSeed DEMO_USER = new UserSeed("Usuario Demo", DEMO_EMAIL, "Lima");

    private static final List<UserSeed> FANS = List.of(
            new UserSeed("Camila Rojas", "camila.rojas@example.com", "Lima"),
            new UserSeed("Diego Mendoza", "diego.mendoza@example.com", "Lima"),
            new UserSeed("Lucía Torres", "lucia.torres@example.com", "Arequipa"),
            new UserSeed("Mateo Salazar", "mateo.salazar@example.com", "Lima"),
            new UserSeed("Valeria Quispe", "valeria.quispe@example.com", "Cusco"),
            new UserSeed("Andrés Paredes", "andres.paredes@example.com", "Lima"),
            new UserSeed("Sofía Cáceres", "sofia.caceres@example.com", "Trujillo"),
            new UserSeed("Jorge Huamán", "jorge.huaman@example.com", "Lima"),
            new UserSeed("Fiorella Díaz", "fiorella.diaz@example.com", "Arequipa"),
            new UserSeed("Renzo Vargas", "renzo.vargas@example.com", "Lima"));

    // Reseñas de 4 y 5 estrellas
    private static final List<String> COMMENTS = List.of(
            "Una noche increíble, el sonido y la producción estuvieron de lujo.",
            "Cantó todos sus clásicos y el público no paró de bailar.",
            "Superó mis expectativas, volvería sin dudarlo.",
            "Mejor concierto del año para mí. Totalmente recomendado.",
            "El repertorio estuvo genial y el recinto se veía espectacular.",
            "Valió cada sol de la entrada. Gran espectáculo visual.",
            "¡Qué emoción! Lo esperé meses y no defraudó para nada.",
            "Lloré con las canciones de siempre, momentazo total.",
            "Las luces y las pantallas estuvieron increíbles, se nota el cariño por el público.",
            "Fui con mis amigos y la pasamos buenísimo, ya quiero que vuelvan.",
            "Sonó perfecto desde donde estaba. Repetiría mil veces.",
            "El mejor ambiente que he vivido en un concierto en Lima.",
            "Puntual, ordenado y con un show que no te deja sentarte ni un minuto.",
            "Ya tengo ganas de verlo otra vez. ¡Gracias por tanto!");

    // Reseñas de 2 y 3 estrellas
    private static final List<String> MIXED_COMMENTS = List.of(
            "Buen concierto, aunque la salida del recinto fue algo caótica.",
            "Muy buena energía, pero el ingreso tardó demasiado.",
            "El artista estuvo genial, pero el sonido desde la tribuna no era el mejor.",
            "Me gustó, aunque esperaba un repertorio más largo.",
            "La música bien, pero las filas para comida y baños fueron eternas.",
            "Estuvo bien, sin más. Esperaba más interacción con el público.");

    private final GenreRepository genreRepository;
    private final ArtistRepository artistRepository;
    private final VenueRepository venueRepository;
    private final ConcertRepository concertRepository;
    private final UserRepository userRepository;
    private final AttendanceRepository attendanceRepository;
    private final ReviewRepository reviewRepository;
    private final FavoriteConcertRepository favoriteConcertRepository;
    private final PasswordEncoder passwordEncoder;
    private final String userPassword;
    private final Resource pastConcertsFile;

    public DemoDataLoader(GenreRepository genreRepository,
                          ArtistRepository artistRepository,
                          VenueRepository venueRepository,
                          ConcertRepository concertRepository,
                          UserRepository userRepository,
                          AttendanceRepository attendanceRepository,
                          ReviewRepository reviewRepository,
                          FavoriteConcertRepository favoriteConcertRepository,
                          PasswordEncoder passwordEncoder,
                          @Value("${app.demo-data.user-password}") String userPassword,
                          @Value("classpath:past-concerts.json") Resource pastConcertsFile) {
        this.genreRepository = genreRepository;
        this.artistRepository = artistRepository;
        this.venueRepository = venueRepository;
        this.concertRepository = concertRepository;
        this.userRepository = userRepository;
        this.attendanceRepository = attendanceRepository;
        this.reviewRepository = reviewRepository;
        this.favoriteConcertRepository = favoriteConcertRepository;
        this.passwordEncoder = passwordEncoder;
        this.userPassword = userPassword;
        this.pastConcertsFile = pastConcertsFile;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Map<String, Artist> artists = loadArtists();
        List<Concert> past = loadPastConcerts(artists);
        loadActivity(past);
        log.info("Datos de ejemplo listos: {} conciertos pasados, usuario demo {}", past.size(), DEMO_EMAIL);
    }

    private Genre genre(String name) {
        return genreRepository.findByNameIgnoreCase(name).orElseGet(() -> genreRepository.save(new Genre(name)));
    }

    private Map<String, Artist> loadArtists() {
        GENRES.forEach(this::genre);
        Map<String, Artist> byName = new HashMap<>();
        artistRepository.findAll().forEach(a -> byName.putIfAbsent(key(a.getName()), a));
        for (ArtistSeed seed : ARTISTS) {
            Set<Genre> seedGenres = seed.genres().stream().map(this::genre).collect(Collectors.toCollection(HashSet::new));
            Artist artist = byName.get(key(seed.name()));
            if (artist == null) {
                artist = new Artist(seed.name(), seed.country(), seed.description(), null);
                artist.setGenres(seedGenres);
                byName.put(key(seed.name()), artistRepository.save(artist));
            } else if (artist.getGenres().isEmpty()) {
                artist.setGenres(seedGenres);
                byName.put(key(seed.name()), artistRepository.save(artist));
            }
        }
        return byName;
    }

    // Conciertos que ya ocurrieron (Lima), leídos de past-concerts.json. Se marcan con externalId "hist:<slug>".
    @SuppressWarnings("unchecked")
    private List<Concert> loadPastConcerts(Map<String, Artist> artists) {
        Map<String, Venue> venues = new HashMap<>();
        venueRepository.findAll().forEach(v -> venues.putIfAbsent(key(v.getName()), v));
        Map<String, Concert> byTitle = new HashMap<>();
        concertRepository.findAll().stream().filter(c -> c.getTitle() != null)
                .forEach(c -> byTitle.putIfAbsent(c.getTitle(), c));

        for (Object entry : readJsonList(pastConcertsFile)) {
            Map<String, Object> data = (Map<String, Object>) entry;
            String title = (String) data.get("title");

            Artist artist = findOrCreateArtist(data, artists);
            Venue venue = venues.get(key((String) data.get("venue")));
            if (venue == null) {
                venue = venueRepository.save(new Venue((String) data.get("venue"), "Lima", "Perú", null, null));
                venues.put(key(venue.getName()), venue);
            }

            Concert concert = byTitle.get(title);
            if (concert == null) {
                concert = new Concert(title, LocalDateTime.parse((String) data.get("date")), null, null, artist, venue);
                concert.setExternalId(PAST_PREFIX + slug(title));
                concertRepository.save(concert);
            } else if (concert.getExternalId() == null) {
                concert.setExternalId(PAST_PREFIX + slug(title));
                concertRepository.save(concert);
            }
        }
        return concertRepository.findAll().stream()
                .filter(c -> c.getExternalId() != null && c.getExternalId().startsWith(PAST_PREFIX))
                .sorted(Comparator.comparing(Concert::getDate))
                .toList();
    }

    @SuppressWarnings("unchecked")
    private Artist findOrCreateArtist(Map<String, Object> data, Map<String, Artist> artists) {
        String name = (String) data.get("artist");
        Artist artist = artists.get(key(name));
        if (artist == null) {
            artist = new Artist(name, (String) data.get("artistCountry"), (String) data.get("artistDescription"), null);
            List<String> genreNames = (List<String>) data.getOrDefault("genres", List.of());
            artist.setGenres(genreNames.stream().map(this::genre).collect(Collectors.toCollection(HashSet::new)));
            artist = artistRepository.save(artist);
            artists.put(key(name), artist);
        }
        return artist;
    }

    private List<Object> readJsonList(Resource resource) {
        try (var in = resource.getInputStream()) {
            return JsonParserFactory.getJsonParser().parseList(StreamUtils.copyToString(in, StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer " + resource.getFilename(), e);
        }
    }

    private void loadActivity(List<Concert> past) {
        LocalDateTime now = LocalDateTime.now();
        List<Concert> pastNewestFirst = past.stream().sorted(Comparator.comparing(Concert::getDate).reversed()).toList();
        // "Voy a ir" y favoritos van a conciertos próximos REALES (importados de Ticketmaster), si ya se sincronizó
        List<Concert> upcoming = concertRepository.findAll().stream()
                .filter(c -> c.getExternalId() != null && c.getExternalId().startsWith(TICKETMASTER_PREFIX))
                .filter(c -> !c.getDate().isBefore(now))
                .sorted(Comparator.comparing(Concert::getDate))
                .toList();

        User demo = findOrCreateUser(DEMO_USER);
        for (int i = 0; i < pastNewestFirst.size(); i++) {
            attend(demo, pastNewestFirst.get(i), AttendanceStatus.YA_FUI);
            if (i < 3) {
                review(demo, pastNewestFirst.get(i), 5 - (i % 2), COMMENTS.get(i));
            }
        }
        for (int i = 0; i < Math.min(4, upcoming.size()); i++) {
            attend(demo, upcoming.get(i), AttendanceStatus.VOY_A_IR);
        }
        // Favoritos del usuario demo: dos conciertos que ya fue y tres próximos
        pastNewestFirst.stream().limit(2).forEach(concert -> favorite(demo, concert));
        upcoming.stream().skip(1).limit(3).forEach(concert -> favorite(demo, concert));

        // Semilla fija: las reseñas "al azar" salen iguales en cada carga (y no se duplican)
        Random random = new Random(42);
        for (int u = 0; u < FANS.size(); u++) {
            User fan = findOrCreateUser(FANS.get(u));
            for (Concert concert : past) {
                if (random.nextInt(100) < 75) {
                    attend(fan, concert, AttendanceStatus.YA_FUI);
                    int roll = random.nextInt(100);
                    int rating = roll < 45 ? 5 : roll < 80 ? 4 : roll < 95 ? 3 : 2;
                    List<String> pool = rating >= 4 ? COMMENTS : MIXED_COMMENTS;
                    review(fan, concert, rating, pool.get(random.nextInt(pool.size())));
                }
            }
            int firstUpcoming = u % 2;
            for (int i = firstUpcoming; i < Math.min(firstUpcoming + 2, upcoming.size()); i++) {
                attend(fan, upcoming.get(i), AttendanceStatus.VOY_A_IR);
            }
        }
    }

    private User findOrCreateUser(UserSeed seed) {
        return userRepository.findByEmail(seed.email()).orElseGet(() ->
                userRepository.save(new User(seed.name(), seed.email(), passwordEncoder.encode(userPassword),
                        "Perú", seed.city())));
    }

    private void attend(User user, Concert concert, AttendanceStatus status) {
        if (attendanceRepository.findByUser_IdAndConcert_Id(user.getId(), concert.getId()).isEmpty()) {
            attendanceRepository.save(Attendance.builder().user(user).concert(concert).status(status).build());
        }
    }

    private void review(User user, Concert concert, int rating, String comment) {
        if (reviewRepository.findByUser_IdAndConcert_Id(user.getId(), concert.getId()).isEmpty()) {
            reviewRepository.save(Review.builder().user(user).concert(concert).rating(rating).comment(comment).build());
        }
    }

    private void favorite(User user, Concert concert) {
        if (!favoriteConcertRepository.existsByUser_IdAndConcert_Id(user.getId(), concert.getId())) {
            favoriteConcertRepository.save(FavoriteConcert.builder().user(user).concert(concert).build());
        }
    }

    private String key(String name) {
        return name.trim().toLowerCase();
    }

    private String slug(String title) {
        String plain = Normalizer.normalize(title, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return plain.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }
}
