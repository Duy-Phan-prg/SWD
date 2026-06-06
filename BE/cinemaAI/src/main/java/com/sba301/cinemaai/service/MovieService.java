package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.movie.MovieCreateRequest;
import com.sba301.cinemaai.dto.response.movie.ActorResponse;
import com.sba301.cinemaai.dto.request.movie.MovieActorAssignmentRequest;
import com.sba301.cinemaai.dto.response.movie.MovieResponse;
import com.sba301.cinemaai.dto.request.movie.MovieStatusUpdateRequest;
import com.sba301.cinemaai.dto.request.movie.MovieUpdateRequest;
import com.sba301.cinemaai.dto.response.PageResponse;
import com.sba301.cinemaai.entity.Actor;
import com.sba301.cinemaai.entity.Genre;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.MovieActor;
import com.sba301.cinemaai.entity.MovieGenre;
import com.sba301.cinemaai.enums.MovieStatus;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.ConflictException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.mapper.MovieMapper;
import com.sba301.cinemaai.repository.MovieGenreRepository;
import com.sba301.cinemaai.repository.MovieRepository;
import com.sba301.cinemaai.repository.ActorRepository;
import com.sba301.cinemaai.repository.MovieActorRepository;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final MovieGenreRepository movieGenreRepository;
    private final MovieActorRepository movieActorRepository;
    private final ActorRepository actorRepository;
    private final GenreService genreService;
    private final MovieMapper movieMapper;

    @Transactional(readOnly = true)
    public PageResponse<MovieResponse> searchPublic(
            String keyword,
            MovieStatus status,
            Long genreId,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size
    ) {
        MovieStatus effectiveStatus = status == null ? null : status;
        Specification<Movie> spec = buildSpec(keyword, effectiveStatus, genreId, fromDate, toDate, true);
        return mapPage(movieRepository.findAll(spec, pageable(page, size)));
    }

    @Transactional(readOnly = true)
    public PageResponse<MovieResponse> searchAdmin(
            String keyword,
            MovieStatus status,
            Long genreId,
            LocalDate fromDate,
            LocalDate toDate,
            int page,
            int size
    ) {
        return mapPage(movieRepository.findAll(buildSpec(keyword, status, genreId, fromDate, toDate, false), pageable(page, size)));
    }

    @Transactional(readOnly = true)
    public MovieResponse getPublic(Long id) {
        Movie movie = findById(id);
        if (movie.getStatus() == MovieStatus.INACTIVE) {
            throw new NotFoundException("Movie not found");
        }
        return toResponse(movie);
    }

    @Transactional(readOnly = true)
    public MovieResponse getAdmin(Long id) {
        return toResponse(findById(id));
    }

    @Transactional
    public MovieResponse create(MovieCreateRequest request) {
        if (movieRepository.existsByTitle(request.title())) {
            throw new ConflictException("Movie title already exists");
        }

        Movie movie = new Movie(request.title(), request.durationMinutes(), request.status());
        List<Actor> actors = resolveActors(request.actorIds());
        applyMovieFields(movie, request.description(), request.releaseDate(), request.trailerUrl(), request.posterUrl(),
                request.avatarUrl(), request.language(), request.subtitleLanguage(), request.ageRating(),
                request.director(), mainActorsText(request.mainActors(), actors), castListText(request.castList(), actors),
                request.status());
        Movie saved = movieRepository.save(movie);
        replaceGenres(saved, request.genreIds());
        replaceActors(saved, actors);
        return toResponse(saved);
    }

    @Transactional
    public MovieResponse update(Long id, MovieUpdateRequest request) {
        Movie movie = findById(id);
        if (movie.getStatus() != MovieStatus.UPCOMING) {
            throw new BadRequestException("Only UPCOMING movies can be updated");
        }
        movieRepository.findByTitle(request.title())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ConflictException("Movie title already exists");
                });
        List<Actor> actors = resolveActors(request.actorIds());
        applyMovieFields(movie, request.description(), request.releaseDate(), request.trailerUrl(), request.posterUrl(),
                request.avatarUrl(), request.language(), request.subtitleLanguage(), request.ageRating(),
                request.director(), mainActorsText(request.mainActors(), actors), castListText(request.castList(), actors),
                request.status());
        movie.updateDetails(request.title(), request.description(), request.durationMinutes(), request.releaseDate());
        replaceGenres(movie, request.genreIds());
        replaceActors(movie, actors);
        return toResponse(movie);
    }

    @Transactional
    public MovieResponse assignActors(Long id, MovieActorAssignmentRequest request) {
        Movie movie = findById(id);
        movieActorRepository.deleteByMovie(movie);
        request.actorIds().stream()
                .distinct()
                .map(this::findActorById)
                .map(actor -> new MovieActor(movie, actor))
                .forEach(movieActorRepository::save);
        return toResponse(movie);
    }

    @Transactional(readOnly = true)
    public List<MovieResponse> getMoviesByActor(Long actorId) {
        Actor actor = findActorById(actorId);
        return movieActorRepository.findByActor(actor)
                .stream()
                .map(MovieActor::getMovie)
                .filter(movie -> movie.getStatus() != MovieStatus.INACTIVE)
                .sorted((left, right) -> {
                    LocalDate leftDate = left.getReleaseDate();
                    LocalDate rightDate = right.getReleaseDate();
                    if (leftDate == null && rightDate == null) {
                        return right.getId().compareTo(left.getId());
                    }
                    if (leftDate == null) {
                        return 1;
                    }
                    if (rightDate == null) {
                        return -1;
                    }
                    int dateCompare = rightDate.compareTo(leftDate);
                    return dateCompare != 0 ? dateCompare : right.getId().compareTo(left.getId());
                })
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MovieResponse updateStatus(Long id, MovieStatusUpdateRequest request) {
        Movie movie = findById(id);
        movie.changeStatus(request.status());
        return toResponse(movie);
    }

    @Transactional
    public void delete(Long id) {
        Movie movie = findById(id);
        movie.changeStatus(MovieStatus.INACTIVE);
    }

    private void applyMovieFields(
            Movie movie,
            String description,
            LocalDate releaseDate,
            String trailerUrl,
            String posterUrl,
            String avatarUrl,
            String language,
            String subtitleLanguage,
            String ageRating,
            String director,
            String mainActors,
            String castList,
            MovieStatus status
    ) {
        movie.updateDetails(movie.getTitle(), description, movie.getDurationMinutes(), releaseDate);
        movie.updateMedia(trailerUrl, posterUrl, avatarUrl);
        movie.updateMetadata(language, subtitleLanguage, ageRating, director, mainActors, castList);
        movie.changeStatus(status);
    }

    private void replaceActors(Movie movie, List<Actor> actors) {
        movieActorRepository.deleteByMovie(movie);
        movieActorRepository.flush();
        actors.stream()
                .distinct()
                .map(actor -> new MovieActor(movie, actor))
                .forEach(movieActorRepository::save);
    }

    private List<Actor> resolveActors(List<Long> actorIds) {
        return actorIds.stream()
                .distinct()
                .map(this::findActorById)
                .toList();
    }

    private String mainActorsText(String requestedMainActors, List<Actor> actors) {
        return requestedMainActors != null && !requestedMainActors.isBlank()
                ? requestedMainActors.trim()
                : actorNamesText(actors);
    }

    private String castListText(String requestedCastList, List<Actor> actors) {
        return requestedCastList != null && !requestedCastList.isBlank()
                ? requestedCastList.trim()
                : actorNamesText(actors);
    }

    private String actorNamesText(List<Actor> actors) {
        return String.join(", ", actors.stream().map(Actor::getName).toList());
    }

    private Actor findActorById(Long id) {
        return actorRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Actor not found"));
    }

    private void replaceGenres(Movie movie, List<Long> genreIds) {
        movieGenreRepository.deleteByMovie(movie);
        movieGenreRepository.flush();
        if (genreIds == null) {
            return;
        }
        genreIds.stream()
                .distinct()
                .map(genreService::findById)
                .map(genre -> new MovieGenre(movie, genre))
                .forEach(movieGenreRepository::save);
    }

    private PageResponse<MovieResponse> mapPage(Page<Movie> page) {
        return PageResponse.from(page.map(this::toResponse));
    }

    private MovieResponse toResponse(Movie movie) {
        List<Genre> genres = movieGenreRepository.findByMovie(movie)
                .stream()
                .map(MovieGenre::getGenre)
                .toList();
        List<ActorResponse> actors = movieActorRepository.findByMovie(movie)
                .stream()
                .map(MovieActor::getActor)
                .map(actor -> movieMapper.toActorResponse(actor, movieActorRepository.countByActor(actor)))
                .toList();
        return movieMapper.toMovieResponse(movie, genres, actors);
    }

    private Movie findById(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Movie not found"));
    }

    private Pageable pageable(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, 100));
        return PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "releaseDate").and(Sort.by("id")));
    }

    private Specification<Movie> buildSpec(
            String keyword,
            MovieStatus status,
            Long genreId,
            LocalDate fromDate,
            LocalDate toDate,
            boolean publicOnly
    ) {
        return (root, query, builder) -> {
            query.distinct(true);
            var predicate = builder.conjunction();
            if (publicOnly) {
                predicate = builder.and(predicate, builder.notEqual(root.get("status"), MovieStatus.INACTIVE));
            }
            if (status != null) {
                predicate = builder.and(predicate, builder.equal(root.get("status"), status));
            }
            if (StringUtils.hasText(keyword)) {
                String pattern = "%" + keyword.toLowerCase() + "%";
                predicate = builder.and(predicate, builder.or(
                        builder.like(builder.lower(root.get("title")), pattern),
                        builder.like(builder.lower(root.get("director")), pattern),
                        builder.like(builder.lower(root.get("language")), pattern)
                ));
            }
            if (fromDate != null) {
                predicate = builder.and(predicate, builder.greaterThanOrEqualTo(root.get("releaseDate"), fromDate));
            }
            if (toDate != null) {
                predicate = builder.and(predicate, builder.lessThanOrEqualTo(root.get("releaseDate"), toDate));
            }
            if (genreId != null) {
                Subquery<Long> subquery = query.subquery(Long.class);
                Root<MovieGenre> movieGenreRoot = subquery.from(MovieGenre.class);
                subquery.select(movieGenreRoot.get("movie").get("id"))
                        .where(builder.equal(movieGenreRoot.get("genre").get("id"), genreId));
                predicate = builder.and(predicate, root.get("id").in(subquery));
            }
            return predicate;
        };
    }
}
