package com.sba301.cinemaai.dto.response.wishlist;

import com.sba301.cinemaai.entity.Wishlist;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class WishlistResponse {

    private Long id;
    private Long movieId;
    private String movieTitle;
    private String posterUrl;
    private LocalDateTime createdAt;

    public static WishlistResponse from(Wishlist wishlist) {
        return WishlistResponse.builder()
                .id(wishlist.getId())
                .movieId(wishlist.getMovie().getId())
                .movieTitle(wishlist.getMovie().getTitle())
                .posterUrl(wishlist.getMovie().getPosterUrl())
                .createdAt(wishlist.getCreatedAt())
                .build();
    }
}
