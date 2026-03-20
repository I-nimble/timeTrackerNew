import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.inimbleapp.timetracker',
    appName: 'inimbleapp',
    webDir: 'dist/browser',
    server: {
    allowNavigation: [
        'chat.inimbleapp.com',
        'home.inimbleapp.com',
        'localhost'
        ],
    },
    ios: {
        contentInset: 'always',
        preferredContentMode: 'mobile',
        allowsLinkPreview: false,
        scheme: 'capacitor'
    },
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
        },
        PushNotifications: {
            presentationOptions: ["badge", "sound", "alert"]
        }
    }
};

export default config;