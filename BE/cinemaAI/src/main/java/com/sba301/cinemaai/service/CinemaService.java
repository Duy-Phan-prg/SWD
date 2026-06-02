package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.cinema.CinemaRequest;
import com.sba301.cinemaai.dto.cinema.CinemaResponse;
import com.sba301.cinemaai.entity.Cinema;
import com.sba301.cinemaai.enums.CinemaStatus;
import com.sba301.cinemaai.exception.ConflictException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.mapper.CinemaMapper;
import com.sba301.cinemaai.repository.CinemaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CinemaService {

    private final CinemaRepository cinemaRepository;
    private final CinemaMapper cinemaMapper;

    @Transactional(readOnly = true)
    public List<CinemaResponse> getPublicCinemas() {
        return cinemaRepository.findByStatus(CinemaStatus.ACTIVE)
                .stream()
                .map(cinemaMapper::toCinemaResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CinemaResponse> getAdminCinemas() {
        return cinemaRepository.findAll()
                .stream()
                .map(cinemaMapper::toCinemaResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CinemaResponse getCinema(Long id) {
        return cinemaMapper.toCinemaResponse(findById(id));
    }

    @Transactional
    public CinemaResponse create(CinemaRequest request) {
        cinemaRepository.findByName(request.name()).ifPresent(cinema -> {
            throw new ConflictException("Cinema name already exists");
        });
        Cinema cinema = new Cinema(request.name(), request.address(), request.city(), request.phone());
        cinema.changeStatus(request.status() == null ? CinemaStatus.ACTIVE : request.status());
        return cinemaMapper.toCinemaResponse(cinemaRepository.save(cinema));
    }

    @Transactional
    public CinemaResponse update(Long id, CinemaRequest request) {
        Cinema cinema = findById(id);
        cinemaRepository.findByName(request.name())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ConflictException("Cinema name already exists");
                });
        cinema.updateInfo(request.name(), request.address(), request.city(), request.phone());
        cinema.changeStatus(request.status() == null ? cinema.getStatus() : request.status());
        return cinemaMapper.toCinemaResponse(cinema);
    }

    @Transactional
    public CinemaResponse updateStatus(Long id, CinemaStatus status) {
        Cinema cinema = findById(id);
        cinema.changeStatus(status);
        return cinemaMapper.toCinemaResponse(cinema);
    }

    @Transactional
    public void delete(Long id) {
        findById(id).changeStatus(CinemaStatus.INACTIVE);
    }

    public Cinema findById(Long id) {
        return cinemaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Cinema not found"));
    }
}
