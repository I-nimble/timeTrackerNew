import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.inimbleapp.timetracker', 
    appName: 'inimbleapp', 
    webDir: 'dist/browser',
    plugins: {
      Camera: {
          enable: true
      },
      Microphone: {
          enable: true
      },
      WebView: {
          androidHardwareAccelerationType: "hardware",
          androidAllowMixedContent: true,
          handleWebRTCPermissions: true 
      },
      StatusBar: {
        style: 'LIGHT',
        overlaysWebView: false,
        backgroundColor: '#EAEAEA'
      },
      NavigationBar: {
        overlay: false
      },
      SplashScreen: {
        launchShowDuration: 3000,
        launchAutoHide: true
      }
    }
};

export default config;