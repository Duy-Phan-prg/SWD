package com.sba301.cinemaai.dto.response.report;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RoomOccupancyResponse {

    private Long roomId;
    private String roomName;
    private long ticketsSold;
    private long roomCapacity;
    private double occupancyRate;
}
