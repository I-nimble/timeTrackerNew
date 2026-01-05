const fs = require('fs');
const path = require('path');

function updateMainActivity() {
  // Use a relative path from the project root
  const mainActivityPath = path.join('android', 'app', 'src', 'main', 'java', 'com', 'inimbleapp', 'timetracker', 'MainActivity.java');
  
  if (!fs.existsSync(mainActivityPath)) {
    console.log('MainActivity.java not found. Make sure the android folder exists and the package path is correct.');
    return;
  }

  const newContent = `package com.inimbleapp.timetracker;

import android.os.Bundle;
import android.webkit.WebView;
import android.content.pm.ApplicationInfo;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Auto-enable WebView debugging only for debug builds
        if (0 != (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE)) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
    }
}
`;

  fs.writeFileSync(mainActivityPath, newContent, 'utf8');
  console.log('MainActivity.java updated successfully!');
}

updateMainActivity();
