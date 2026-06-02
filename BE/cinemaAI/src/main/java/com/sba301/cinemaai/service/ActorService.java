package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.movie.ActorRequest;
import com.sba301.cinemaai.dto.movie.ActorResponse;
import com.sba301.cinemaai.entity.Actor;
import com.sba301.cinemaai.exception.ConflictException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.mapper.MovieMapper;
import com.sba301.cinemaai.repository.ActorRepository;
import com.sba301.cinemaai.repository.MovieActorRepository;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ActorService {

    private final ActorRepository actorRepository;
    private final MovieActorRepository movieActorRepository;
    private final MovieMapper movieMapper;

    @Transactional(readOnly = true)
    public List<ActorResponse> getActors() {
        return actorRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Actor::getName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ActorResponse getActor(Long id) {
        return toResponse(findById(id));
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
        return movieMapper.toActorResponse(actor, movieActorRepository.countByActor(actor));
    }
}
