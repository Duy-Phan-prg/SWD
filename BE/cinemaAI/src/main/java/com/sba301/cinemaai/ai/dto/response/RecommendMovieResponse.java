package com.sba301.cinemaai.ai.dto.response;

import lombok.Data;

@Data
public class RecommendMovieResponse {


    private Long movieId;


    private String title;


    private String posterUrl;


    private Double similarity;

}
