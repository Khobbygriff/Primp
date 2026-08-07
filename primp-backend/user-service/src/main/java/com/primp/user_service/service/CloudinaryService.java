package com.primp.user_service.service;

import com.cloudinary.Cloudinary;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public void deleteImage(String imageUrl) {
        try {
            String publicId = extractPublicId(imageUrl);
            System.out.println("Deleting from Cloudinary, publicId: " + publicId);
            if (publicId != null) {
                Map result = cloudinary.uploader().destroy(publicId, Map.of());
                System.out.println("Cloudinary delete result: " + result);
            }
        } catch (Exception e) {
            System.err.println("Failed to delete image from Cloudinary: " + e.getMessage());
        }
    }

    public void deleteVideo(String videoUrl) {
        try {
            String publicId = extractPublicId(videoUrl);
            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, Map.of("resource_type", "video"));
            }
        } catch (Exception e) {
            System.err.println("Failed to delete video from Cloudinary: " + e.getMessage());
        }
    }

    private String extractPublicId(String url) {
        try {
            // Handle both original and optimized URLs
            // Format: https://res.cloudinary.com/cloud/image/upload/[transformations/][v123/]folder/file.ext

            String[] uploadSplit = url.split("/upload/");
            if (uploadSplit.length < 2) return null;

            String afterUpload = uploadSplit[1];

            // Remove transformation string — it contains underscores and commas
            // e.g. q_auto,f_auto,w_800,c_limit/
            String[] segments = afterUpload.split("/");
            int startIndex = 0;

            for (int i = 0; i < segments.length; i++) {
                String segment = segments[i];
                // Skip transformation segments (contain _ or ,)
                // Skip version segments (start with v followed by digits)
                if (segment.contains("_") || segment.contains(",") ||
                        (segment.startsWith("v") && segment.substring(1).matches("\\d+"))) {
                    startIndex = i + 1;
                } else {
                    break;
                }
            }

            // Rebuild path from actual content segments
            StringBuilder publicId = new StringBuilder();
            for (int i = startIndex; i < segments.length; i++) {
                if (publicId.length() > 0) publicId.append("/");
                publicId.append(segments[i]);
            }

            // Remove file extension
            String result = publicId.toString();
            int dotIndex = result.lastIndexOf(".");
            if (dotIndex > 0) {
                result = result.substring(0, dotIndex);
            }

            return result.isEmpty() ? null : result;
        } catch (Exception e) {
            System.err.println("Failed to extract public ID from URL: " + url);
            return null;
        }
    }
}