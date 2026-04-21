package com.loveapp.api;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin
public class MessageController {
    private final JdbcTemplate jdbc;
    private final AuthController authController;

    public MessageController(JdbcTemplate jdbc, AuthController authController) {
        this.jdbc = jdbc;
        this.authController = authController;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@RequestParam(defaultValue = "100") int limit) {
        var sql = "select id, sender, content, created_at from couple_messages order by created_at desc limit ?";
        return ApiResponse.ok(jdbc.queryForList(sql, Math.min(limit, 200)));
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(
            @RequestHeader(value = "X-Auth-Token", required = false) String token,
            @RequestBody Map<String, String> body
    ) {
        String sender = authController.resolveOpenid(token);
        if (sender == null) return ApiResponse.fail("unauthorized");

        String content = body.getOrDefault("content", "").trim();
        if (content.isEmpty()) return ApiResponse.fail("content cannot be empty");

        var id = jdbc.queryForObject(
                "insert into couple_messages(sender, content, created_at) values (?, ?, ?) returning id",
                String.class,
                sender,
                content,
                Timestamp.from(Instant.now())
        );
        return ApiResponse.ok(Map.of("id", id));
    }
}
