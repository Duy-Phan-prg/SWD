package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.movie.ActorRequest;
import com.sba301.cinemaai.dto.response.movie.ActorResponse;
import com.sba301.cinemaai.entity.Actor;
import com.sba301.cinemaai.entity.Movie;
import com.sba301.cinemaai.entity.MovieActor;
import com.sba301.cinemaai.exception.ConflictException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.mapper.MovieMapper;
import com.sba301.cinemaai.repository.ActorRepository;
import com.sba301.cinemaai.repository.MovieActorRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ActorService {

    private final ActorRepository actorRepository;
    private final MovieActorRepository movieActorRepository;
    private final MovieMapper movieMapper;

    @Transactional(readOnly = true)
    public List<ActorResponse> searchAdminActors(String keyword, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        PageRequest pageRequest = PageRequest.of(0, safeLimit);
        var results = StringUtils.hasText(keyword)
                ? actorRepository.searchAdminWithMovieCount(keyword.trim(), pageRequest)
                : actorRepository.findAdminWithMovieCount(pageRequest);
        return results
                .stream()
                .map(result -> movieMapper.toActorResponse(result.getActor(), result.getMovieCount()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ActorResponse> searchPublicActors(String keyword, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        PageRequest pageRequest = PageRequest.of(0, safeLimit);
        var results = StringUtils.hasText(keyword)
                ? actorRepository.searchPublicWithMovieCount(keyword.trim(), pageRequest)
                : actorRepository.findPublicWithMovieCount(pageRequest);
        return results
                .stream()
                .map(result -> movieMapper.toActorResponse(result.getActor(), result.getMovieCount()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ActorResponse getPublicActor(Long id) {
        return actorRepository.findPublicWithMovieCountById(id)
                .map(result -> movieMapper.toActorResponse(result.getActor(), result.getMovieCount()))
                .orElseThrow(() -> new NotFoundException("Actor not found"));
    }

    @Transactional
    public ActorResponse create(ActorRequest request) {
        String name = request.name().trim();
        if (actorRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException("Actor name already exists");
        }
        return toResponse(actorRepository.save(new Actor(name, request.biography(), request.avatarUrl())));
    }

    @Transactional
    public ActorResponse update(Long id, ActorRequest request) {
        Actor actor = findById(id);
        String name = request.name().trim();
        actorRepository.findByNameIgnoreCase(name)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ConflictException("Actor name already exists");
        });
        actor.update(name, request.biography(), request.avatarUrl());
        refreshMovieActorMetadata(actor);
        return toResponse(actor);
    }

    @Transactional
    public void delete(Long id) {
        Actor actor = findById(id);
        if (movieActorRepository.countByActor(actor) > 0) {
            throw new ConflictException("Actor is used by movies");
        }
        actorRepository.delete(actor);
    }

    public Actor findById(Long id) {
        return actorRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Actor not found"));
    }

    private ActorResponse toResponse(Actor actor) {
        return actorRepository.findWithMovieCountByIdIn(List.of(actor.getId()))
                .stream()
                .findFirst()
                .map(result -> movieMapper.toActorResponse(result.getActor(), result.getMovieCount()))
                .orElseThrow(() -> new NotFoundException("Actor not found"));
    }

    private void refreshMovieActorMetadata(Actor actor) {
        movieActorRepository.findByActor(actor).stream()
                .map(MovieActor::getMovie)
                .distinct()
                .forEach(this::refreshActorMetadata);
    }

    private void refreshActorMetadata(Movie movie) {
        List<MovieActor> actorLinks = movieActorRepository.findByMovie(movie);
        String castList = joinActorNames(actorLinks);
        String mainActors = joinActorNames(actorLinks.stream()
                .filter(MovieActor::isMainActor)
                .toList());
        movie.updateMetadata(
                movie.getLanguage(),
                movie.getSubtitleLanguage(),
                movie.getAgeRating(),
                movie.getDirector(),
                mainActors,
                castList
        );
    }

    private String joinActorNames(List<MovieActor> actorLinks) {
        return actorLinks.stream()
                .map(link -> link.getActor().getName())
                .collect(Collectors.joining(", "));
    }
}
