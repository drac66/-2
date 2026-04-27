package com.errorbook.app.ui;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;

public class DesktopFrame extends JFrame {
    public DesktopFrame() {
        setTitle("Error Book - Desktop(Java)");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1200, 760);
        setLocationRelativeTo(null);

        setLayout(new BorderLayout());

        JPanel topBar = buildTopBar();
        JSplitPane mainSplit = buildMainSplit();

        add(topBar, BorderLayout.NORTH);
        add(mainSplit, BorderLayout.CENTER);
    }

    private JPanel buildTopBar() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(new EmptyBorder(8, 12, 8, 12));

        JLabel title = new JLabel("错题库管理（电脑端）");
        title.setFont(title.getFont().deriveFont(Font.BOLD, 18f));

        JTextField search = new JTextField();
        search.setPreferredSize(new Dimension(280, 32));
        search.setToolTipText("关键词搜索题干/错误原因");

        JButton addBtn = new JButton("新增错题");

        JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 8, 0));
        right.add(new JLabel("搜索:"));
        right.add(search);
        right.add(addBtn);

        panel.add(title, BorderLayout.WEST);
        panel.add(right, BorderLayout.EAST);
        return panel;
    }

    private JSplitPane buildMainSplit() {
        JPanel filterPanel = buildFilterPanel();
        JPanel listPanel = buildListPanel();
        JPanel detailPanel = buildDetailPanel();

        JSplitPane rightSplit = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, listPanel, detailPanel);
        rightSplit.setResizeWeight(0.55);

        JSplitPane mainSplit = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, filterPanel, rightSplit);
        mainSplit.setResizeWeight(0.2);
        return mainSplit;
    }

    private JPanel buildFilterPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(new EmptyBorder(12, 12, 12, 12));

        DefaultListModel<String> model = new DefaultListModel<>();
        model.addElement("全部分类");
        model.addElement("Java");
        model.addElement("Python");
        model.addElement("算法");
        model.addElement("前端框架");

        JList<String> categoryList = new JList<>(model);
        categoryList.setSelectedIndex(0);

        panel.add(new JLabel("分类筛选"), BorderLayout.NORTH);
        panel.add(new JScrollPane(categoryList), BorderLayout.CENTER);
        return panel;
    }

    private JPanel buildListPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(new EmptyBorder(12, 12, 12, 6));

        String[] columns = {"题目", "分类", "最近复习"};
        Object[][] rows = {
                {"Java Stream map/filter 用错", "Java", "2026-04-26"},
                {"二分查找边界条件错误", "算法", "2026-04-27"}
        };

        JTable table = new JTable(rows, columns);
        table.setRowHeight(28);

        panel.add(new JLabel("错题列表"), BorderLayout.NORTH);
        panel.add(new JScrollPane(table), BorderLayout.CENTER);
        return panel;
    }

    private JPanel buildDetailPanel() {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(new EmptyBorder(12, 6, 12, 12));

        JTextArea detail = new JTextArea();
        detail.setEditable(false);
        detail.setLineWrap(true);
        detail.setWrapStyleWord(true);
        detail.setText("选中左侧错题后，在这里显示题干、错误答案、正确答案、错误原因。\n\n支持：编辑 / 删除 / 标记已掌握");

        JPanel actions = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        actions.add(new JButton("编辑"));
        actions.add(new JButton("删除"));
        actions.add(new JButton("开始复习"));

        panel.add(new JLabel("错题详情"), BorderLayout.NORTH);
        panel.add(new JScrollPane(detail), BorderLayout.CENTER);
        panel.add(actions, BorderLayout.SOUTH);
        return panel;
    }
}
