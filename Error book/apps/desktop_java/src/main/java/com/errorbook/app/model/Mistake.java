package com.errorbook.app.model;

import java.util.ArrayList;
import java.util.List;

public class Mistake {
    private String id;
    private String question;
    private String wrongAnswer;
    private String correctAnswer;
    private String reason;
    private String category;
    private String questionImagePath;
    private String wrongAnswerImagePath;
    private String correctAnswerImagePath;
    private List<String> tags = new ArrayList<>();

    public Mistake() {}

    public Mistake(String id, String question, String wrongAnswer, String correctAnswer, String reason, String category) {
        this(id, question, wrongAnswer, correctAnswer, reason, category, "", "", "");
    }

    public Mistake(String id, String question, String wrongAnswer, String correctAnswer, String reason, String category,
                   String questionImagePath, String wrongAnswerImagePath, String correctAnswerImagePath) {
        this.id = id;
        this.question = question;
        this.wrongAnswer = wrongAnswer;
        this.correctAnswer = correctAnswer;
        this.reason = reason;
        this.category = category;
        this.questionImagePath = questionImagePath;
        this.wrongAnswerImagePath = wrongAnswerImagePath;
        this.correctAnswerImagePath = correctAnswerImagePath;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getWrongAnswer() { return wrongAnswer; }
    public void setWrongAnswer(String wrongAnswer) { this.wrongAnswer = wrongAnswer; }
    public String getCorrectAnswer() { return correctAnswer; }
    public void setCorrectAnswer(String correctAnswer) { this.correctAnswer = correctAnswer; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getQuestionImagePath() { return questionImagePath; }
    public void setQuestionImagePath(String questionImagePath) { this.questionImagePath = questionImagePath; }
    public String getWrongAnswerImagePath() { return wrongAnswerImagePath; }
    public void setWrongAnswerImagePath(String wrongAnswerImagePath) { this.wrongAnswerImagePath = wrongAnswerImagePath; }
    public String getCorrectAnswerImagePath() { return correctAnswerImagePath; }
    public void setCorrectAnswerImagePath(String correctAnswerImagePath) { this.correctAnswerImagePath = correctAnswerImagePath; }
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public Object[] toRow() {
        return new Object[]{question, category, id};
    }

    @Override
    public String toString() {
        return question;
    }
}
