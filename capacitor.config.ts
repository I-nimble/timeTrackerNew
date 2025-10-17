import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inimbleapp.timetracker', 
  appName: 'inimbleapp', 
  webDir: 'dist/browser',
  plugins: {
    StatusBar: {
      style: 'DEFAULT',
      overlaysWebView: false,
    },
    NavigationBar: {
      overlay: false
    },
    SplashScreen: {
      launchShowDuration: 3000,
    }
  }
};

export default config;