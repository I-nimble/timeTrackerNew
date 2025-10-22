package com.inimbleapp.timetracker;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.view.Window;
import android.view.View;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        setTheme(R.style.AppTheme_NoActionBar);
        super.onCreate(savedInstanceState);
        
        configureSystemBars();
    }
    
    private void configureSystemBars() {
    Window window = getWindow();
    
    // Clear any translucent flags
    window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS); 
    window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION); 
    window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
    
    // Add flags to draw system bar backgrounds
    window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
    
    // Set status bar color (non-transparent)
    window.setStatusBarColor(getResources().getColor(R.color.colorPrimaryDark));
    
    // Set navigation bar color
    window.setNavigationBarColor(getResources().getColor(R.color.navigationBarLight));
    
    // For modern Android versions (API 30+) - ensure content is correctly fitted
    if (android.os.Build.VERSION.SDK_INT >= 30) {
        window.setDecorFitsSystemWindows(true);
    }
    
    // For Android 16+ - ensure content doesn't appear under status bar
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
        window.getAttributes().layoutInDisplayCutoutMode = android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
    }
    
    // Additional fix for API 36
    if (android.os.Build.VERSION.SDK_INT >= 34) { 
        window.setDecorFitsSystemWindows(true); 
    }
    
    // Ensure light status bar is disabled (dark icons)
    View decorView = window.getDecorView();
    int systemUiVisibility = decorView.getSystemUiVisibility();
    systemUiVisibility &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
    decorView.setSystemUiVisibility(systemUiVisibility);
    }
}