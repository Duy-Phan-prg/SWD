package com.sba301.cinemaai.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.sba301.cinemaai.config.CloudinaryCredentials;
import com.sba301.cinemaai.dto.response.upload.UploadedFileResponse;
import com.sba301.cinemaai.entity.UploadedFile;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.exception.NotFoundException;
import com.sba301.cinemaai.repository.UploadedFileRepository;
import com.sba301.cinemaai.repository.UserRepository;
import java.io.IOException;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class CloudinaryUploadService {

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final Cloudinary cloudinary;
    private final CloudinaryCredentials cloudinaryCredentials;
    private final UploadedFileRepository uploadedFileRepository;
    private final UserRepository userRepository;

    @Transactional
    public UploadedFileResponse uploadImage(MultipartFile file, String requestedFolder, Long userId) {
        validateImage(file);
        validateCloudinaryConfiguration();
        String folder = normalizeFolder(requestedFolder);
        User uploadedBy = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        Map<?, ?> result = uploadToCloudinary(file, folder);
        String url = String.valueOf(result.get("secure_url"));
        String publicId = String.valueOf(result.get("public_id"));
        UploadedFile savedFile = uploadedFileRepository.save(new UploadedFile(
                file.getOriginalFilename(),
                publicId,
                "CLOUDINARY",
                url,
                file.getContentType(),
                file.getSize(),
                uploadedBy
        ));
        return toResponse(savedFile);
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is required");
        }
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new BadRequestException("Image file must not exceed 5 MB");
        }
        if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Only JPG, PNG, and WEBP images are allowed");
        }
    }

    private void validateCloudinaryConfiguration() {
        if (!cloudinaryCredentials.isConfigured()) {
            throw new BadRequestException("Cloudinary is not configured");
        }
    }

    private Map<?, ?> uploadToCloudinary(MultipartFile file, String folder) {
        try {
            return cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "cinema-ai/" + folder,
                            "resource_type", "image",
                            "unique_filename", true
                    )
            );
        } catch (IOException | RuntimeException exception) {
            throw new BadRequestException("Cloudinary upload failed: " + cloudinaryErrorMessage(exception));
        }
    }

    private String cloudinaryErrorMessage(Exception exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            return "Unknown Cloudinary error";
        }
        return message;
    }

    private String normalizeFolder(String folder) {
        if (folder == null || folder.isBlank()) {
            return "images";
        }
        String normalized = folder.trim().toLowerCase().replaceAll("[^a-z0-9-]", "-");
        return normalized.isBlank() ? "images" : normalized;
    }

    private UploadedFileResponse toResponse(UploadedFile file) {
        return new UploadedFileResponse(
                file.getId(),
                file.getUrl(),
                file.getOriginalFilename(),
                file.getMimeType(),
                file.getFileSize()
        );
    }
}
