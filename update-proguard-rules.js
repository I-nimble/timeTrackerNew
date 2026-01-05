const fs = require('fs');
const path = require('path');

function updateProguardRules() {
  const proguardPath = path.join('android', 'app', 'proguard-rules.pro');
  
  if (!fs.existsSync(proguardPath)) {
    console.log('proguard-rules.pro not found. Make sure the android folder exists.');
    return;
  }

  let content = fs.readFileSync(proguardPath, 'utf8');
  
  const rules = [
    '# Capacitor Proguard Rules',
    '-keep class com.getcapacitor.** { *; }',
    '-keep class com.capacitorjs.** { *; }',
    '-keep class com.capacitorjs.plugins.localnotifications.** { *; }',
  ];

  let updated = false;
  rules.forEach(rule => {
    if (rule && !content.includes(rule)) {
      content += '\n' + rule;
      updated = true;
      console.log(`Added: ${rule}`);
    }
  });

  if (updated) {
    fs.writeFileSync(proguardPath, content, 'utf8');
    console.log('proguard-rules.pro updated successfully!');
  } else {
    console.log('All proguard rules already exist.');
  }
}

updateProguardRules();
