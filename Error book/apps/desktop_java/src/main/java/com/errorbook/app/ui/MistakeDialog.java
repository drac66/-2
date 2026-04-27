package com.errorbook.app.ui;

import com.errorbook.app.model.Mistake;

import javax.swing.*;
import java.awt.*;

public class MistakeDialog extends JDialog {
    private final JTextField question = new JTextField();
    private final JTextField wrong = new JTextField();
    private final JTextField correct = new JTextField();
    private final JTextField reason = new JTextField();
    private final JTextField category = new JTextField();
    private Mistake result;

    public MistakeDialog(Window owner, Mistake source) {
        super(owner, "编辑错题", ModalityType.APPLICATION_MODAL);
        setSize(520, 320);
        setLocationRelativeTo(owner);
        setLayout(new BorderLayout());

        JPanel form = new JPanel(new GridLayout(5, 2, 8, 8));
        form.setBorder(BorderFactory.createEmptyBorder(12, 12, 12, 12));
        form.add(new JLabel("题干")); form.add(question);
        form.add(new JLabel("错误答案")); form.add(wrong);
        form.add(new JLabel("正确答案")); form.add(correct);
        form.add(new JLabel("错误原因")); form.add(reason);
        form.add(new JLabel("分类")); form.add(category);

        JButton ok = new JButton("保存");
        JButton cancel = new JButton("取消");
        JPanel actions = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        actions.add(cancel); actions.add(ok);

        if (source != null) {
            question.setText(source.getQuestion());
            wrong.setText(source.getWrongAnswer());
            correct.setText(source.getCorrectAnswer());
            reason.setText(source.getReason());
            category.setText(source.getCategory());
        }

        ok.addActionListener(e -> {
            if (question.getText().isBlank()) return;
            Mistake m = new Mistake();
            if (source != null) m.setId(source.getId());
            m.setQuestion(question.getText().trim());
            m.setWrongAnswer(wrong.getText().trim());
            m.setCorrectAnswer(correct.getText().trim());
            m.setReason(reason.getText().trim());
            m.setCategory(category.getText().trim().isEmpty() ? "未分类" : category.getText().trim());
            result = m;
            dispose();
        });
        cancel.addActionListener(e -> dispose());

        add(form, BorderLayout.CENTER);
        add(actions, BorderLayout.SOUTH);
    }

    public Mistake getResult() { return result; }
}
