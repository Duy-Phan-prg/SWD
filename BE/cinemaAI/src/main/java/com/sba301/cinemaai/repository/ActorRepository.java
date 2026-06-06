package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.Actor;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActorRepository extends JpaRepository<Actor, Long> {

    Optional<Actor> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    List<Actor> findByNameContainingIgnoreCaseOrderByNameAsc(String keyword, Pageable pageable);
}
