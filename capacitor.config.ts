import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.inimbleapp.timetracker', 
    appName: 'inimbleapp', 
    webDir: 'dist/browser',
    plugins: {
      PushNotifications: {
        presentationOptions: ["badge", "sound", "alert"]
      },
      FirebaseMessaging: {
        presentationOptions: ["badge", "sound", "alert"]
      }
    }
};

export default config;