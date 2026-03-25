import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vanuway.app',
  appName: 'VanuWay',
  webDir: 'dist',
  server: {
    // Use live URL for now until static build is ready
    url: 'https://app.vanuway.com',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#233C6F',
      showSpinner: true,
      spinnerColor: '#EF5E33',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#233C6F',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK',
    },
  },
};

export default config;
