package com.sba301.cinemaai.service;

import com.sba301.cinemaai.dto.request.notification.NotificationCreateRequest;
import com.sba301.cinemaai.dto.response.notification.NotificationResponse;
import com.sba301.cinemaai.entity.Notification;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.repository.NotificationRepository;
import com.sba301.cinemaai.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public NotificationResponse createForUser(NotificationCreateRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new NotFoundException("User not found: " + request.getUserId()));

        Notification notification = new Notification(
                user,
                request.getTitle(),
                request.getMessage(),
                request.getType()
        );

        return NotificationResponse.from(notificationRepository.save(notification));
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyUnread(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalse(userId)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional
    public NotificationResponse markRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new NotFoundException("Notification not found: " + notificationId));

        if (Boolean.TRUE.equals(notification.getIsRead())) {
            return NotificationResponse.from(notification);
        }

        notification.markRead();
        return NotificationResponse.from(notificationRepository.save(notification));
    }
}
