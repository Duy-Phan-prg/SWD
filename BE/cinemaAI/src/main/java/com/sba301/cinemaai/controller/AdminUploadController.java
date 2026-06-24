package com.sba301.cinemaai.controller;

import com.sba301.cinemaai.dto.response.ApiResponse;
import com.sba301.cinemaai.dto.response.upload.UploadedFileResponse;
import com.sba301.cinemaai.security.AuthenticatedUser;
import com.sba301.cinemaai.service.CloudinaryUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/admin/uploads")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Admin - Uploads", description = "Admin Cloudinary upload endpoints")
public class AdminUploadController {

    private final CloudinaryUploadService cloudinaryUploadService;

    @PostMapping("/images")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload image to Cloudinary")
    public ApiResponse<UploadedFileResponse> uploadImage(
            @RequestParam MultipartFile file,
            @RequestParam(defaultValue = "images") String folder,
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.success(
                cloudinaryUploadService.uploadImage(file, folder, currentUser.id()),
                "Image uploaded successfully"
        );
    }
}
