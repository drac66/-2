package com.errorbook.app.repository;

import com.errorbook.app.model.Mistake;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class MistakeRepository {
    private final List<Mistake> items = new ArrayList<>();
    private final Path dbPath;

    public MistakeRepository(Path dbPath) {
        this.dbPath = dbPath;
    }

    public void load() {
        items.clear();
        if (!Files.exists(dbPath)) {
            seed();
            save();
            return;
        }
        try {
            String s = Files.readString(dbPath, StandardCharsets.UTF_8);
            Pattern p = Pattern.compile("\\{\\s*\"id\":\"(.*?)\",\"question\":\"(.*?)\",\"wrongAnswer\":\"(.*?)\",\"correctAnswer\":\"(.*?)\",\"reason\":\"(.*?)\",\"category\":\"(.*?)\"\\s*}");
            Matcher m = p.matcher(s);
            while (m.find()) {
                items.add(new Mistake(m.group(1), unescape(m.group(2)), unescape(m.group(3)), unescape(m.group(4)), unescape(m.group(5)), unescape(m.group(6))));
            }
            if (items.isEmpty()) seed();
        } catch (IOException e) {
            seed();
        }
    }

    public void save() {
        try {
            Files.createDirectories(dbPath.getParent());
            String json = "[\n" + items.stream().map(this::toJson).collect(Collectors.joining(",\n")) + "\n]";
            Files.writeString(dbPath, json, StandardCharsets.UTF_8);
        } catch (IOException ignored) {}
    }

    public List<Mistake> all() { return new ArrayList<>(items); }

    public List<Mistake> query(String keyword, String category) {
        String k = keyword == null ? "" : keyword.trim().toLowerCase();
        String c = category == null ? "全部分类" : category;
        return items.stream().filter(i -> {
            boolean okCat = "全部分类".equals(c) || i.getCategory().equalsIgnoreCase(c);
            boolean okKey = k.isBlank() || i.getQuestion().toLowerCase().contains(k) || i.getReason().toLowerCase().contains(k);
            return okCat && okKey;
        }).collect(Collectors.toList());
    }

    public Mistake addOrUpdate(Mistake m) {
        if (m.getId() == null || m.getId().isBlank()) m.setId(UUID.randomUUID().toString().substring(0, 8));
        int idx = -1;
        for (int i = 0; i < items.size(); i++) if (items.get(i).getId().equals(m.getId())) idx = i;
        if (idx >= 0) items.set(idx, m); else items.add(m);
        save();
        return m;
    }

    public void delete(String id) {
        items.removeIf(x -> x.getId().equals(id));
        save();
    }

    public Mistake randomOne() {
        if (items.isEmpty()) return null;
        int idx = (int) (Math.random() * items.size());
        return items.get(idx);
    }

    private void seed() {
        items.add(new Mistake("m001", "Java Stream filter/map顺序写错", "先map后filter", "先filter后map", "先筛选再映射更清晰", "Java"));
        items.add(new Mistake("m002", "二分查找边界条件错误", "while(l<r)", "while(l<=r)", "漏掉最后一个候选", "算法"));
    }

    private String toJson(Mistake m) {
        return String.format("  {\"id\":\"%s\",\"question\":\"%s\",\"wrongAnswer\":\"%s\",\"correctAnswer\":\"%s\",\"reason\":\"%s\",\"category\":\"%s\"}",
                escape(m.getId()), escape(m.getQuestion()), escape(m.getWrongAnswer()), escape(m.getCorrectAnswer()), escape(m.getReason()), escape(m.getCategory()));
    }

    private String escape(String s) { return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\""); }
    private String unescape(String s) { return s == null ? "" : s.replace("\\\"", "\"").replace("\\\\", "\\"); }
}
