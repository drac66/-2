package com.loveapp.api;

import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/albums")
@CrossOrigin
public class AlbumController {
    private final JdbcTemplate jdbc;
    private final AuthController authController;

    public AlbumController(JdbcTemplate jdbc, AuthController authController) {
        this.jdbc = jdbc;
        this.authController = authController;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@RequestParam(defaultValue = "100") int limit) {
        var sql = "select id, owner, media_type, media_url, note, created_at from couple_albums order by created_at desc limit ?";
        return ApiResponse.ok(jdbc.queryForList(sql, Math.min(limit, 200)));
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@RequestBody Map<String, String> body) {
        String owner = body.getOrDefault("owner", "unknown");
        String mediaType = body.getOrDefault("media_type", "image");
        String mediaUrl = body.getOrDefault("media_url", "").trim();
        String note = body.getOrDefault("note", "").trim();

        if (!("image".equals(mediaType) || "video".equals(mediaType))) {
            return ApiResponse.fail("media_type must be image or video");
        }
        if (mediaUrl.isEmpty()) return ApiResponse.fail("media_url cannot be empty");

        var id = jdbc.queryForObject(
                "insert into couple_albums(owner, media_type, media_url, note, created_at) values (?, ?, ?, ?, ?) returning id",
                String.class,
                owner,
                mediaType,
                mediaUrl,
                note,
                Timestamp.from(Instant.now())
        );
        return ApiResponse.ok(Map.of("id", id));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, Object>> upload(
            @RequestHeader(value = "X-Auth-Token", required = false) String token,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "note", required = false, defaultValue = "") String note,
            @RequestParam(value = "mediaType", required = false, defaultValue = "image") String mediaType
    ) {
        String openid = authController.resolveOpenid(token);
        if (openid == null) return ApiResponse.fail("unauthorized");

        String normalizedType = normalizeMediaType(mediaType, file.getContentType());
        if (!("image".equals(normalizedType) || "video".equals(normalizedType))) {
            return ApiResponse.fail("mediaType must be image or video");
        }

        if (file.isEmpty()) return ApiResponse.fail("file cannot be empty");

        try {
            String ext = guessExt(file.getOriginalFilename(), file.getContentType(), normalizedType);
            String filename = UUID.randomUUID() + ext;

            Path uploadRoot = Paths.get("uploads", "albums");
            Files.createDirectories(uploadRoot);
            Path target = uploadRoot.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String mediaUrl = "/uploads/albums/" + filename;
            String safeNote = note == null ? "" : note.trim();
            var id = jdbc.queryForObject(
                    "insert into couple_albums(owner, media_type, media_url, note, created_at) values (?, ?, ?, ?, ?) returning id",
                    String.class,
                    openid,
                    normalizedType,
                    mediaUrl,
                    safeNote,
                    Timestamp.from(Instant.now())
            );

            return ApiResponse.ok(Map.of(
                    "id", id,
                    "media_url", mediaUrl,
                    "owner", openid
            ));
        } catch (IOException e) {
            return ApiResponse.fail("upload error: " + e.getMessage());
        }
    }

    private String normalizeMediaType(String mediaType, String contentType) {
        if (mediaType != null && !mediaType.isBlank()) {
            String mt = mediaType.trim().toLowerCase();
            if ("image".equals(mt) || "video".equals(mt)) return mt;
        }
        if (contentType != null) {
            if (contentType.startsWith("video/")) return "video";
            if (contentType.startsWith("image/")) return "image";
        }
        return "image";
    }

    private String guessExt(String original, String contentType, String mediaType) {
        String lower = original == null ? "" : original.toLowerCase();
        int i = lower.lastIndexOf('.');
        if (i > -1 && i < lower.length() - 1) {
            return lower.substring(i);
        }
        if (contentType != null) {
            if (contentType.equals("image/png")) return ".png";
            if (contentType.equals("image/jpeg")) return ".jpg";
            if (contentType.equals("image/webp")) return ".webp";
            if (contentType.equals("video/mp4")) return ".mp4";
            if (contentType.equals("video/quicktime")) return ".mov";
        }
        return "video".equals(mediaType) ? ".mp4" : ".jpg";
    }
}
