package com.loveapp.api;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/albums")
@CrossOrigin
public class AlbumController {
    private final JdbcTemplate jdbc;

    public AlbumController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
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
}
