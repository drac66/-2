package com.errorbook.app.ui;

import com.errorbook.app.model.Mistake;
import com.errorbook.app.repository.MistakeRepository;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.nio.file.Path;
import java.util.List;

public class DesktopFrame extends JFrame {
    private final MistakeRepository repo = new MistakeRepository(Path.of("data", "mistakes.json"));

    private final JTextField searchField = new JTextField();
    private final DefaultListModel<String> categoryModel = new DefaultListModel<>();
    private final JList<String> categoryList = new JList<>(categoryModel);
    private final DefaultTableModel tableModel = new DefaultTableModel(new Object[]{"题目", "分类", "ID"}, 0) {
        @Override public boolean isCellEditable(int row, int column) { return false; }
    };
    private final JTable table = new JTable(tableModel);
    private final JTextArea detail = new JTextArea();

    private List<Mistake> current = List.of();

    public DesktopFrame() {
        setTitle("Error Book - Desktop(Java)");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1220, 780);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout());

        repo.load();

        add(buildTopBar(), BorderLayout.NORTH);
        add(buildMainSplit(), BorderLayout.CENTER);

        refreshCategories();
        applyFilter();
    }

    private JPanel buildTopBar() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(new EmptyBorder(8, 12, 8, 12));

        JLabel title = new JLabel("错题本（电脑端 · Java）");
        title.setFont(title.getFont().deriveFont(Font.BOLD, 18f));

        searchField.setPreferredSize(new Dimension(280, 32));
        searchField.setToolTipText("关键词搜索题干/错误原因");

        JButton searchBtn = new JButton("搜索");
        JButton resetBtn = new JButton("重置");
        JButton addBtn = new JButton("新增错题");
        JButton randomBtn = new JButton("随机复习");

        searchBtn.addActionListener(e -> applyFilter());
        resetBtn.addActionListener(e -> { searchField.setText(""); categoryList.setSelectedIndex(0); applyFilter(); });
        addBtn.addActionListener(e -> onAdd());
        randomBtn.addActionListener(e -> onRandomReview());

        JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        right.add(new JLabel("搜索:"));
        right.add(searchField);
        right.add(searchBtn);
        right.add(resetBtn);
        right.add(addBtn);
        right.add(randomBtn);

        panel.add(title, BorderLayout.WEST);
        panel.add(right, BorderLayout.EAST);
        return panel;
    }

    private JSplitPane buildMainSplit() {
        JPanel filterPanel = buildFilterPanel();
        JPanel listPanel = buildListPanel();
        JPanel detailPanel = buildDetailPanel();

        JSplitPane rightSplit = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, listPanel, detailPanel);
        rightSplit.setResizeWeight(0.58);

        JSplitPane mainSplit = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, filterPanel, rightSplit);
        mainSplit.setResizeWeight(0.2);
        return mainSplit;
    }

    private JPanel buildFilterPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(new EmptyBorder(12, 12, 12, 12));
        panel.add(new JLabel("分类筛选"), BorderLayout.NORTH);

        categoryList.addListSelectionListener(e -> { if (!e.getValueIsAdjusting()) applyFilter(); });
        panel.add(new JScrollPane(categoryList), BorderLayout.CENTER);
        return panel;
    }

    private JPanel buildListPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(new EmptyBorder(12, 12, 12, 6));

        table.setRowHeight(28);
        table.getSelectionModel().addListSelectionListener(e -> { if (!e.getValueIsAdjusting()) showSelectedDetail(); });

        panel.add(new JLabel("错题列表"), BorderLayout.NORTH);
        panel.add(new JScrollPane(table), BorderLayout.CENTER);
        return panel;
    }

    private JPanel buildDetailPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(new EmptyBorder(12, 6, 12, 12));

        detail.setEditable(false);
        detail.setLineWrap(true);
        detail.setWrapStyleWord(true);
        detail.setText("选择一条错题查看详情");

        JButton editBtn = new JButton("编辑");
        JButton deleteBtn = new JButton("删除");

        editBtn.addActionListener(e -> onEdit());
        deleteBtn.addActionListener(e -> onDelete());

        JPanel actions = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        actions.add(editBtn);
        actions.add(deleteBtn);

        panel.add(new JLabel("错题详情"), BorderLayout.NORTH);
        panel.add(new JScrollPane(detail), BorderLayout.CENTER);
        panel.add(actions, BorderLayout.SOUTH);
        return panel;
    }

    private void refreshCategories() {
        categoryModel.clear();
        categoryModel.addElement("全部分类");
        repo.all().stream().map(Mistake::getCategory).distinct().sorted().forEach(categoryModel::addElement);
        if (categoryModel.getSize() > 0 && categoryList.getSelectedIndex() < 0) categoryList.setSelectedIndex(0);
    }

    private String selectedCategory() {
        String v = categoryList.getSelectedValue();
        return v == null ? "全部分类" : v;
    }

    private void applyFilter() {
        current = repo.query(searchField.getText(), selectedCategory());
        tableModel.setRowCount(0);
        for (Mistake m : current) tableModel.addRow(m.toRow());
        detail.setText(current.isEmpty() ? "暂无数据" : "选择一条错题查看详情");
    }

    private Mistake selected() {
        int row = table.getSelectedRow();
        if (row < 0 || row >= current.size()) return null;
        return current.get(row);
    }

    private void showSelectedDetail() {
        Mistake m = selected();
        if (m == null) { detail.setText("选择一条错题查看详情"); return; }
        detail.setText("题干:\n" + m.getQuestion() + "\n\n错误答案:\n" + m.getWrongAnswer() + "\n\n正确答案:\n" + m.getCorrectAnswer() + "\n\n错误原因:\n" + m.getReason() + "\n\n分类: " + m.getCategory() + "\nID: " + m.getId());
    }

    private void onAdd() {
        MistakeDialog dialog = new MistakeDialog(this, null);
        dialog.setVisible(true);
        Mistake result = dialog.getResult();
        if (result != null) {
            repo.addOrUpdate(result);
            refreshCategories();
            applyFilter();
        }
    }

    private void onEdit() {
        Mistake m = selected();
        if (m == null) return;
        MistakeDialog dialog = new MistakeDialog(this, m);
        dialog.setVisible(true);
        Mistake result = dialog.getResult();
        if (result != null) {
            repo.addOrUpdate(result);
            refreshCategories();
            applyFilter();
        }
    }

    private void onDelete() {
        Mistake m = selected();
        if (m == null) return;
        int ok = JOptionPane.showConfirmDialog(this, "确认删除这条错题？", "删除确认", JOptionPane.YES_NO_OPTION);
        if (ok == JOptionPane.YES_OPTION) {
            repo.delete(m.getId());
            refreshCategories();
            applyFilter();
        }
    }

    private void onRandomReview() {
        Mistake m = repo.randomOne();
        if (m == null) { JOptionPane.showMessageDialog(this, "当前没有错题可复习"); return; }
        String msg = "随机复习\n\n题干:\n" + m.getQuestion() + "\n\n请先自己作答，再点击确定查看答案";
        JOptionPane.showMessageDialog(this, msg);
        String ans = "正确答案:\n" + m.getCorrectAnswer() + "\n\n错误原因:\n" + m.getReason();
        JOptionPane.showMessageDialog(this, ans);
    }
}
