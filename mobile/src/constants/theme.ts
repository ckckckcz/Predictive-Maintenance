/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0f172a',
    background: '#ffffff',
    backgroundElement: '#f8fafc',
    backgroundSelected: '#f1f5f9',
    textSecondary: '#64748b',
    primary: '#15803d',
    primaryLight: '#f0fdf4',
    border: '#e2e8f0',
    healthy: '#16a34a',
    warning: '#ea580c',
    critical: '#dc2626',
    cardBg: '#ffffff',
  },
  dark: {
    text: '#f8fafc',
    background: '#090d16',
    backgroundElement: '#131924',
    backgroundSelected: '#1e293b',
    textSecondary: '#94a3b8',
    primary: '#22c55e',
    primaryLight: '#14532d',
    border: '#1e293b',
    healthy: '#22c55e',
    warning: '#f97316',
    critical: '#ef4444',
    cardBg: '#0f172a',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
