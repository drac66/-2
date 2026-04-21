package com.loveapp.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Value("${wechat.appid:}")
    private String appId;

    @Value("${wechat.secret:}")
    private String appSecret;

    @Value("${wechat.openid-whitelist:}")
    private String openidWhitelist;

    private final Map<String, String> tokenToOpenid = new ConcurrentHashMap<>();

    public AuthController(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostMapping("/wx-login")
    public ApiResponse<Map<String, Object>> wxLogin(@RequestBody Map<String, String> body) {
        String code = Optional.ofNullable(body.get("code")).orElse("").trim();
        if (code.isEmpty()) return ApiResponse.fail("code is required");
        if (appId == null || appId.isBlank() || appSecret == null || appSecret.isBlank()) {
            return ApiResponse.fail("wechat appid/secret not configured");
        }

        try {
            String url = "https://api.weixin.qq.com/sns/jscode2session"
                    + "?appid=" + URLEncoder.encode(appId, StandardCharsets.UTF_8)
                    + "&secret=" + URLEncoder.encode(appSecret, StandardCharsets.UTF_8)
                    + "&js_code=" + URLEncoder.encode(code, StandardCharsets.UTF_8)
                    + "&grant_type=authorization_code";

            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .timeout(Duration.ofSeconds(8))
                    .GET()
                    .build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
                return ApiResponse.fail("wx login http error: " + resp.statusCode());
            }

            JsonNode json = objectMapper.readTree(resp.body());
            if (json.hasNonNull("errcode") && json.get("errcode").asInt() != 0) {
                return ApiResponse.fail("wx login failed: " + json.path("errmsg").asText("unknown") + " (" + json.path("errcode").asInt() + ")");
            }

            String openid = json.path("openid").asText("");
            if (openid.isBlank()) return ApiResponse.fail("openid missing");

            Set<String> whitelist = parseWhitelist(openidWhitelist);
            if (!whitelist.contains(openid)) {
                return ApiResponse.fail("no permission");
            }

            String token = UUID.randomUUID().toString();
            tokenToOpenid.put(token, openid);

            return ApiResponse.ok(Map.of(
                    "token", token,
                    "openid", openid
            ));
        } catch (Exception e) {
            return ApiResponse.fail("wx login error: " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me(@RequestHeader(value = "X-Auth-Token", required = false) String token) {
        String openid = resolveOpenid(token);
        if (openid == null) return ApiResponse.fail("unauthorized");
        return ApiResponse.ok(Map.of("openid", openid));
    }

    public boolean isTokenAllowed(String token) {
        String openid = resolveOpenid(token);
        if (openid == null) return false;
        return parseWhitelist(openidWhitelist).contains(openid);
    }

    public String resolveOpenid(String token) {
        if (token == null || token.isBlank()) return null;
        return tokenToOpenid.get(token);
    }

    private Set<String> parseWhitelist(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptySet();
        Set<String> set = new HashSet<>();
        for (String part : raw.split(",")) {
            String s = part.trim();
            if (!s.isEmpty()) set.add(s);
        }
        return set;
    }
}
