import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';

/**
 * Initialize Capacitor plugins for native platforms.
 * Safe to call on web — checks platform before executing.
 */
export async function initCapacitor() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Capacitor] Running on web, skipping native init');
    return;
  }

  console.log('[Capacitor] Initializing native plugins...');

  try {
    // Status bar
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#233C6F' });
  } catch (e) {
    console.warn('[Capacitor] StatusBar init failed:', e);
  }

  try {
    // Hide splash screen after app loads
    await SplashScreen.hide();
  } catch (e) {
    console.warn('[Capacitor] SplashScreen hide failed:', e);
  }

  try {
    // Keyboard events (for mobile form handling)
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px');
    });
  } catch (e) {
    console.warn('[Capacitor] Keyboard init failed:', e);
  }

  try {
    // Handle back button on Android
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch (e) {
    console.warn('[Capacitor] App back button handler failed:', e);
  }

  console.log('[Capacitor] Native plugins initialized');
}

/**
 * Check if running as a native app
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get the current platform
 */
export function getPlatform(): string {
  return Capacitor.getPlatform();
}
