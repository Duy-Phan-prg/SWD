package com.sba301.cinemaai.dto.movie;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record MovieActorAssignmentRequest(
        @NotEmpty(message = "Actor ids are required")
        List<Long> actorIds
) {
}
