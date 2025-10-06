import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.inimbleapp.timetracker', 
    appName: 'inimbleapp', 
    webDir: 'dist/browser',
    server: {
        hostname: 'home.inimbleapp.com' 
    }
};

export default config;
