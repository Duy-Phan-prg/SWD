package com.sba301.cinemaai.scheduler;

import com.sba301.cinemaai.service.BulkRefundService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class BulkRefundRetryScheduler {

    private final BulkRefundService bulkRefundService;

    @Value("${cinema.bulk-refund.enable:true}")
    private boolean enabled;

    @Scheduled(fixedDelayString = "${cinema.bulk-refund.retry-delay-seconds:60}000")
    public void retryPendingRefunds() {
        if (!enabled) {
            return;
        }
        int processed = bulkRefundService.retryPendingRefunds();
        if (processed > 0) {
            log.info("Bulk refund retry processed {} booking(s)", processed);
        }
    }
}
