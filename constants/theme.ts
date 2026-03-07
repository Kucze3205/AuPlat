/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#ea7a1f';
const tintColorDark = '#f28f33';

export const Colors = {
  // 60-30-10 rule:
  // - 60% base background
  // - 30% secondary gray surfaces and borders
  // - 10% orange accent (actions/highlights)
  light: {
    text: '#1f1d1a',
    background: '#fbfaf8',
    surface: '#ebe8e2',
    tint: tintColorLight,
    icon: '#8d857a',
    tabIconDefault: '#8d857a',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#f2eee8',
    background: '#151311',
    surface: '#2b2824',
    tint: tintColorDark,
    icon: '#8f877d',
    tabIconDefault: '#8f877d',
    tabIconSelected: tintColorDark,
  },
};

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
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
