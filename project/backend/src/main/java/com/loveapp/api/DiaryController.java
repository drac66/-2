package com.loveapp.api;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diary")
@CrossOrigin
public class DiaryController {
    private final JdbcTemplate jdbc;
    private final AuthController authController;

    public DiaryController(JdbcTemplate jdbc, AuthController authController) {
        this.jdbc = jdbc;
        this.authController = authController;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        String viewer = authController.resolveOpenid(token);
        if (viewer == null) return ApiResponse.fail("unauthorized");

        var sql = """
                select id, author, title, content, visibility, created_at
                from couple_diary
                where visibility = 'both' or author = ?
                order by created_at desc
                limit 200
                """;
        return ApiResponse.ok(jdbc.queryForList(sql, viewer));
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(
            @RequestHeader(value = "X-Auth-Token", required = false) String token,
            @RequestBody Map<String, String> body
    ) {
        String author = authController.resolveOpenid(token);
        if (author == null) return ApiResponse.fail("unauthorized");

        String title = body.getOrDefault("title", "").trim();
        String content = body.getOrDefault("content", "").trim();
        String visibility = body.getOrDefault("visibility", "self");

        if (content.isEmpty()) return ApiResponse.fail("content cannot be empty");
        if (!("self".equals(visibility) || "both".equals(visibility))) {
            return ApiResponse.fail("visibility must be self or both");
        }

        var id = jdbc.queryForObject(
                "insert into couple_diary(author, title, content, visibility, created_at) values (?, ?, ?, ?, ?) returning id",
                String.class,
                author,
                title,
                content,
                visibility,
                Timestamp.from(Instant.now())
        );
        return ApiResponse.ok(Map.of("id", id));
    }
}
