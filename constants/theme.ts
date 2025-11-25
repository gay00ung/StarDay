/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Palette = {
  starYellow: '#FFE48B',
  starOutline: '#6A3B1F',
  midnightPurple: '#3B2B87',
  auroraIndigo: '#4D3ECF',
  neoBlue: '#3E63FF',
  magicalPink: '#E6A1FF',
  sparkleWhite: '#FFFFFF',
  softWarmGlow: '#FFECE1',
  fairyGold: '#FFDB70',
  lavenderBase: '#DCC5FF',
  softPurple: '#C5A6F1',
  astroLilac: '#B28DEB',
  cheekPink: '#FFACBB',
  ribbonPink: '#F596C4',
  starCuteOrange: '#FFCC80',
} as const;

export const Colors = {
  light: {
    text: Palette.starOutline,
    mutedText: Palette.astroLilac,
    background: Palette.softWarmGlow,
    surface: Palette.sparkleWhite,
    tint: Palette.ribbonPink,
    icon: Palette.astroLilac,
    tabIconDefault: Palette.astroLilac,
    tabIconSelected: Palette.ribbonPink,
    border: Palette.fairyGold,
    highlight: Palette.starYellow,
    badge: Palette.cheekPink,
    success: Palette.starCuteOrange,
  },
  dark: {
    text: Palette.sparkleWhite,
    mutedText: Palette.lavenderBase,
    background: Palette.midnightPurple,
    surface: Palette.auroraIndigo,
    tint: Palette.fairyGold,
    icon: Palette.starYellow,
    tabIconDefault: Palette.magicalPink,
    tabIconSelected: Palette.fairyGold,
    border: Palette.magicalPink,
    highlight: Palette.starYellow,
    badge: Palette.ribbonPink,
    success: Palette.starCuteOrange,
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
