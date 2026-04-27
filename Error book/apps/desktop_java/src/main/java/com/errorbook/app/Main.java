package com.errorbook.app;

import com.errorbook.app.ui.DesktopFrame;

import javax.swing.SwingUtilities;

public class Main {
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            DesktopFrame frame = new DesktopFrame();
            frame.setVisible(true);
        });
    }
}
