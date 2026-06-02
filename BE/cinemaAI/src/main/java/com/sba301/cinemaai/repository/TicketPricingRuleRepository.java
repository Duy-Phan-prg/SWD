package com.sba301.cinemaai.repository;

import com.sba301.cinemaai.entity.TicketPricingRule;
import com.sba301.cinemaai.enums.RoomType;
import com.sba301.cinemaai.enums.TicketType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketPricingRuleRepository extends JpaRepository<TicketPricingRule, Long> {

    List<TicketPricingRule> findByActiveTrue();

    Optional<TicketPricingRule> findFirstByTicketTypeAndRoomTypeAndWeekendAndHolidayAndActiveTrueOrderByUpdatedAtDesc(
            TicketType ticketType,
            RoomType roomType,
            boolean weekend,
            boolean holiday
    );
}
