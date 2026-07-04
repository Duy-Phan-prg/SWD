package com.sba301.cinemaai.service.impl;

import com.sba301.cinemaai.config.MailProperties;
import com.sba301.cinemaai.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.sba301.cinemaai.service.MailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailServiceImpl implements MailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final MailProperties mailProperties;

    public void sendOtp(String to, String otp, String purpose) {
        if (!mailProperties.isEnabled()) {
            log.warn("OTP email was not sent because MAIL_ENABLED/app.mail.enabled is false");
            return;
        }
        if (to == null || to.isBlank()) {
            throw new BadRequestException("Recipient email is required");
        }
        if (mailProperties.getFrom() == null || mailProperties.getFrom().isBlank()) {
            throw new BadRequestException("Mail sender is not configured");
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new BadRequestException("Mail sender is not configured");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(mailProperties.getFrom());
            helper.setTo(to);
            helper.setSubject("CinemaAI - Mã xác minh của bạn");
            helper.setText(buildOtpEmail(purpose, otp), true);
            mailSender.send(message);
        } catch (MailException | MessagingException exception) {
            throw new BadRequestException("Could not send OTP email");
        }
    }

    @Override
    public void sendRefundFailedNotice(String to, String bookingCode, BigDecimal amount, String reason) {
        if (!mailProperties.isEnabled()) {
            log.warn("Refund failure email was not sent because MAIL_ENABLED/app.mail.enabled is false");
            return;
        }
        if (to == null || to.isBlank()) {
            log.warn("Refund failure email skipped because recipient email is blank for booking {}", bookingCode);
            return;
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || mailProperties.getFrom() == null || mailProperties.getFrom().isBlank()) {
            log.warn("Refund failure email skipped because mail sender is not configured for booking {}", bookingCode);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(mailProperties.getFrom());
            helper.setTo(to);
            helper.setSubject("CinemaAI - Thông báo hoàn tiền chưa thành công");
            helper.setText(buildRefundFailedEmail(bookingCode, amount, reason), true);
            mailSender.send(message);
        } catch (MailException | MessagingException exception) {
            log.error("Could not send refund failure email for booking {}", bookingCode, exception);
        }
    }

    private String buildRefundFailedEmail(String bookingCode, BigDecimal amount, String reason) {
        String formattedAmount = amount == null
                ? "N/A"
                : NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN")).format(amount) + " VND";
        String safeReason = reason == null || reason.isBlank() ? "Suất chiếu bị hủy do sự cố vận hành" : reason;

        return """
                <!doctype html>
                <html lang="vi">
                <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.6;">
                    <h2>Thông báo hoàn tiền chưa thành công</h2>
                    <p>Xin chào,</p>
                    <p>Suất chiếu của bạn đã bị hủy và hệ thống đã cố gắng hoàn tiền về đúng tài khoản/phương thức bạn đã dùng khi thanh toán, nhưng giao dịch hoàn tiền tự động chưa thành công.</p>
                    <ul>
                        <li><strong>Mã đơn:</strong> %s</li>
                        <li><strong>Số tiền:</strong> %s</li>
                        <li><strong>Lý do:</strong> %s</li>
                    </ul>
                    <p>Đội ngũ rạp sẽ liên hệ với bạn qua email này để hỗ trợ xử lý tiếp. Bạn không cần thực hiện thêm thao tác trên hệ thống.</p>
                    <p>Trân trọng,<br>CinemaAI</p>
                </body>
                </html>
                """.formatted(bookingCode, formattedAmount, safeReason);
    }

    private String buildOtpEmail(String purpose, String otp) {
        return """
                <!doctype html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body {
                            margin: 0;
                            padding: 0;
                            background: #f4f6f8;
                            color: #1f2937;
                            font-family: Arial, Helvetica, sans-serif;
                        }
                        .wrapper {
                            width: 100%%;
                            padding: 32px 0;
                            background: #f4f6f8;
                        }
                        .container {
                            max-width: 560px;
                            margin: 0 auto;
                            background: #ffffff;
                            border: 1px solid #e5e7eb;
                            border-radius: 8px;
                            overflow: hidden;
                        }
                        .header {
                            padding: 24px 28px;
                            background: #111827;
                            color: #ffffff;
                        }
                        .brand {
                            margin: 0;
                            font-size: 24px;
                            font-weight: 700;
                            letter-spacing: 0;
                        }
                        .tagline {
                            margin: 6px 0 0;
                            color: #d1d5db;
                            font-size: 14px;
                        }
                        .content {
                            padding: 28px;
                        }
                        .title {
                            margin: 0 0 12px;
                            color: #111827;
                            font-size: 20px;
                            font-weight: 700;
                        }
                        .text {
                            margin: 0 0 18px;
                            color: #4b5563;
                            font-size: 15px;
                            line-height: 1.6;
                        }
                        .otp-box {
                            margin: 24px 0;
                            padding: 20px;
                            background: #fff7ed;
                            border: 1px solid #fed7aa;
                            border-radius: 8px;
                            text-align: center;
                        }
                        .otp-label {
                            margin: 0 0 8px;
                            color: #9a3412;
                            font-size: 13px;
                            font-weight: 700;
                            text-transform: uppercase;
                        }
                        .otp-code {
                            margin: 0;
                            color: #111827;
                            font-size: 34px;
                            font-weight: 700;
                            letter-spacing: 6px;
                        }
                        .notice {
                            margin: 20px 0 0;
                            padding: 14px 16px;
                            background: #f9fafb;
                            border-left: 4px solid #f97316;
                            color: #4b5563;
                            font-size: 14px;
                            line-height: 1.5;
                        }
                        .footer {
                            padding: 18px 28px;
                            background: #f9fafb;
                            border-top: 1px solid #e5e7eb;
                            color: #6b7280;
                            font-size: 13px;
                            line-height: 1.5;
                        }
                    </style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="container">
                            <div class="header">
                                <p class="brand">CinemaAI</p>
                                <p class="tagline">Trải nghiệm điện ảnh của bạn bắt đầu tại đây.</p>
                            </div>
                            <div class="content">
                                <h1 class="title">Mã xác minh của bạn</h1>
                                <p class="text">Xin chào,</p>
                                <p class="text">Cảm ơn bạn đã lựa chọn CinemaAI. Vui lòng sử dụng mã bên dưới để tiếp tục thao tác: %s.</p>
                                <div class="otp-box">
                                    <p class="otp-label">Mã xác minh</p>
                                    <p class="otp-code">%s</p>
                                </div>
                                <p class="notice">Mã này có hiệu lực trong 1 phút 30 giây. Để bảo vệ tài khoản, vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                                <p class="text" style="margin-top: 20px;">Nếu bạn không yêu cầu mã này, bạn có thể bỏ qua email này.</p>
                            </div>
                            <div class="footer">
                                CinemaAI<br>
                                Nền tảng đặt vé và trải nghiệm điện ảnh trực tuyến.
                            </div>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(purpose, otp);
    }
}
