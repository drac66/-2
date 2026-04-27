package com.errorbook.app.repository;

import com.errorbook.app.model.Mistake;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class HttpMistakeRepository {
    private final String baseUrl;
    private final HttpClient client = HttpClient.newHttpClient();

    public HttpMistakeRepository(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public List<Mistake> query(String keyword, String category) {
        try {
            String url = baseUrl + "/mistakes?keyword=" + enc(nvl(keyword)) + "&category=" + enc(nvl(category));
            String body = get(url);
            return parseArray(body);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public List<Mistake> all() {
        return query("", "全部分类");
    }

    public Mistake addOrUpdate(Mistake m) {
        try {
            if (m.getId() == null || m.getId().isBlank()) {
                String body = post(baseUrl + "/mistakes", toJson(m));
                return parseOne(body);
            } else {
                String body = put(baseUrl + "/mistakes/" + enc(m.getId()), toJson(m));
                return parseOne(body);
            }
        } catch (Exception e) {
            return m;
        }
    }

    public void delete(String id) {
        try { del(baseUrl + "/mistakes/" + enc(id)); } catch (Exception ignored) {}
    }

    public Mistake randomOne() {
        try {
            String body = get(baseUrl + "/mistakes/random");
            if (body == null || body.equals("null")) return null;
            return parseOne(body);
        } catch (Exception e) {
            return null;
        }
    }

    public Map<String, Integer> statsByCategory() {
        Map<String, Integer> map = new LinkedHashMap<>();
        try {
            String body = get(baseUrl + "/stats");
            Matcher m = Pattern.compile("\\\"byCategory\\\"\\s*:\\s*\\{(.*?)\\}", Pattern.DOTALL).matcher(body);
            if (m.find()) {
                String inner = m.group(1);
                Matcher p = Pattern.compile("\\\"(.*?)\\\"\\s*:\\s*(\\d+)").matcher(inner);
                while (p.find()) map.put(unescape(p.group(1)), Integer.parseInt(p.group(2)));
            }
        } catch (Exception ignored) {}
        return map;
    }

    public int statsTotal() {
        try {
            String body = get(baseUrl + "/stats");
            Matcher m = Pattern.compile("\\\"total\\\"\\s*:\\s*(\\d+)").matcher(body);
            if (m.find()) return Integer.parseInt(m.group(1));
        } catch (Exception ignored) {}
        return 0;
    }

    private String get(String url) throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
        return client.send(req, HttpResponse.BodyHandlers.ofString()).body();
    }

    private String post(String url, String json) throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json)).build();
        return client.send(req, HttpResponse.BodyHandlers.ofString()).body();
    }

    private String put(String url, String json) throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url))
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(json)).build();
        return client.send(req, HttpResponse.BodyHandlers.ofString()).body();
    }

    private void del(String url) throws IOException, InterruptedException {
        HttpRequest req = HttpRequest.newBuilder().uri(URI.create(url)).DELETE().build();
        client.send(req, HttpResponse.BodyHandlers.ofString());
    }

    private String enc(String s) { return URLEncoder.encode(s, StandardCharsets.UTF_8); }
    private String nvl(String s) { return s == null ? "" : s; }

    private String toJson(Mistake m) {
        return String.format(Locale.ROOT,
                "{\"id\":\"%s\",\"question\":\"%s\",\"wrongAnswer\":\"%s\",\"correctAnswer\":\"%s\",\"reason\":\"%s\",\"category\":\"%s\"}",
                esc(m.getId()), esc(m.getQuestion()), esc(m.getWrongAnswer()), esc(m.getCorrectAnswer()), esc(m.getReason()), esc(m.getCategory()));
    }

    private List<Mistake> parseArray(String s) {
        List<Mistake> out = new ArrayList<>();
        Matcher m = Pattern.compile("\\{(.*?)\\}", Pattern.DOTALL).matcher(s);
        while (m.find()) {
            Mistake one = parseOne("{" + m.group(1) + "}");
            if (one != null) out.add(one);
        }
        return out;
    }

    private Mistake parseOne(String s) {
        if (s == null || s.isBlank()) return null;
        String id = val(s, "id");
        String q = val(s, "question");
        String w = val(s, "wrongAnswer");
        String c = val(s, "correctAnswer");
        String r = val(s, "reason");
        String cat = val(s, "category");
        if (q.isBlank() && id.isBlank()) return null;
        return new Mistake(id, q, w, c, r, cat);
    }

    private String val(String s, String key) {
        Matcher m = Pattern.compile("\\\"" + Pattern.quote(key) + "\\\"\\s*:\\s*\\\"(.*?)\\\"", Pattern.DOTALL).matcher(s);
        return m.find() ? unescape(m.group(1)) : "";
    }

    private String esc(String s) { return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\""); }
    private String unescape(String s) { return s == null ? "" : s.replace("\\\"", "\"").replace("\\\\", "\\"); }
}
