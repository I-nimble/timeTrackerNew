const fs = require('fs');
const path = require('path');

function addAndroidPermissions() {
  const androidManifestPath = path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml');
  
  if (!fs.existsSync(androidManifestPath)) {
    console.log('AndroidManifest.xml not found. Make sure the android folder exists.');
    return;
  }

  let manifestContent = fs.readFileSync(androidManifestPath, 'utf8');
  
  const permissions = [
    '<uses-permission android:name="android.permission.CAMERA" />',
    '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
    '<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />',
    '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />',
    '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
    '<uses-permission android:name="android.permission.WAKE_LOCK" />',
    '<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />',
    '<uses-permission android:name="android.permission.VIBRATE" />',
    '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />',
  ];

  let updated = false;
  
  permissions.forEach(permission => {
    if (!manifestContent.includes(permission)) {
      const manifestTagEnd = manifestContent.indexOf('>', manifestContent.indexOf('<manifest')) + 1;
      manifestContent = manifestContent.slice(0, manifestTagEnd) + '\n    ' + permission + manifestContent.slice(manifestTagEnd);
      updated = true;
      console.log(`Added: ${permission}`);
    } else {
      console.log(`Already exists: ${permission}`);
    }
  });

  if (updated) {
    fs.writeFileSync(androidManifestPath, manifestContent, 'utf8');
    console.log('AndroidManifest.xml updated successfully!');
  } else {
    console.log('All permissions already exist in AndroidManifest.xml');
  }
}

addAndroidPermissions();