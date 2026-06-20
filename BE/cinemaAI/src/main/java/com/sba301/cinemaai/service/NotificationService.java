package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.notification.NotificationCreateRequest;
import com.sba301.cinemaai.dto.response.notification.NotificationResponse;
import java.util.List;

public interface NotificationService {

        public NotificationResponse createForUser(NotificationCreateRequest request);

        public List<NotificationResponse> getMyNotifications(Long userId);

        public List<NotificationResponse> getMyUnread(Long userId);

        public NotificationResponse markRead(Long userId, Long notificationId);
}
