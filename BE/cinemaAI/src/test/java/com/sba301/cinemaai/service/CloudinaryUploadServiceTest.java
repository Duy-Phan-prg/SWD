package com.sba301.cinemaai.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.sba301.cinemaai.config.CloudinaryCredentials;
import com.sba301.cinemaai.entity.User;
import com.sba301.cinemaai.exception.BadRequestException;
import com.sba301.cinemaai.repository.UploadedFileRepository;
import com.sba301.cinemaai.repository.UserRepository;
import com.sba301.cinemaai.service.impl.CloudinaryUploadServiceImpl;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CloudinaryUploadServiceTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @Mock
    private UploadedFileRepository uploadedFileRepository;

    @Mock
    private UserRepository userRepository;

    private CloudinaryUploadService cloudinaryUploadService;

    @BeforeEach
    void setUp() {
        cloudinaryUploadService = new CloudinaryUploadServiceImpl(
                cloudinary,
                new CloudinaryCredentials("dmcodhbcc", "api-key", "api-secret"),
                uploadedFileRepository,
                userRepository
        );
    }

    @Test
    void shouldTranslateCloudinaryRuntimeFailureToBadRequest() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "poster.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                new byte[] {1}
        );
        User user = new User("admin@example.com", "password", "Admin", "0900111222");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap()))
                .thenThrow(new RuntimeException("Invalid cloud_name dmcodhbcc"));

        assertThatThrownBy(() -> cloudinaryUploadService.uploadImage(file, "posters", 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Cloudinary upload failed: Invalid cloud_name dmcodhbcc");

        verify(uploadedFileRepository, never()).save(any());
    }

    @Test
    void shouldRejectMissingCloudinaryConfigurationBeforeUpload() {
        cloudinaryUploadService = new CloudinaryUploadServiceImpl(
                cloudinary,
                new CloudinaryCredentials("", "api-key", "api-secret"),
                uploadedFileRepository,
                userRepository
        );
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "poster.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                new byte[] {1}
        );

        assertThatThrownBy(() -> cloudinaryUploadService.uploadImage(file, "posters", 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Cloudinary is not configured");

        verify(userRepository, never()).findById(any());
        assertThat(file.getSize()).isEqualTo(1);
    }
}
