package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.movie.GenreRequest;
import com.sba301.cinemaai.dto.response.movie.GenreResponse;
import com.sba301.cinemaai.entity.Genre;
import com.sba301.cinemaai.exception.ConflictException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.mapper.MovieMapper;
import com.sba301.cinemaai.repository.GenreRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GenreService {

    private final GenreRepository genreRepository;
    private final MovieMapper movieMapper;

    @Transactional(readOnly = true)
    public List<GenreResponse> getGenres() {
        return genreRepository.findAll()
                .stream()
                .map(movieMapper::toGenreResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GenreResponse getGenre(Long id) {
        return movieMapper.toGenreResponse(findById(id));
    }

    @Transactional
    public GenreResponse create(GenreRequest request) {
        if (genreRepository.existsByName(request.name())) {
            throw new ConflictException("Genre name already exists");
        }
        return movieMapper.toGenreResponse(genreRepository.save(new Genre(request.name(), request.description())));
    }

    @Transactional
    public GenreResponse update(Long id, GenreRequest request) {
        Genre genre = findById(id);
        genreRepository.findByName(request.name())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ConflictException("Genre name already exists");
                });
        genre.update(request.name(), request.description());
        return movieMapper.toGenreResponse(genre);
    }

    @Transactional
    public void delete(Long id) {
        genreRepository.delete(findById(id));
    }

    public Genre findById(Long id) {
        return genreRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Genre not found"));
    }
}
