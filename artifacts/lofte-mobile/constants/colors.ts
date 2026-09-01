/**
 * Lofte design tokens — dark-first, mirrors the web app's index.css.
 * HSL values converted to hex. Both light and dark keys hold the same
 * dark-mode palette so the app looks correct regardless of system theme.
 */

const colors = {
  light: {
    // Legacy aliases
    text: '#F4F5F7',
    tint: '#D84B32',

    // Surfaces
    background: '#111315',   // hsl(210 10% 7.5%)
    foreground: '#F4F5F7',   // hsl(220 11% 96%)
    card: '#1B1E22',         // hsl(214 11% 12%)
    cardForeground: '#F4F5F7',
    elevated: '#262A2F',     // hsl(213 11% 17%)

    // Brand — Lofte red
    primary: '#D84B32',      // hsl(10 68% 52%)
    primaryForeground: '#F4F5F7',

    // Achievement gold
    secondary: '#C99A2E',    // hsl(42 63% 48%)
    secondaryForeground: '#111315',

    // Muted / subdued
    muted: '#1B1E22',
    mutedForeground: '#9CA3AF',  // hsl(218 10% 65%)

    // Accent (elevated surface)
    accent: '#262A2F',
    accentForeground: '#F4F5F7',

    // Status
    destructive: '#C74D4D',  // hsl(0 53% 54%)
    destructiveForeground: '#F4F5F7',
    success: '#3F8F68',      // hsl(151 39% 40%)
    successForeground: '#F4F5F7',

    // Chrome
    border: '#343941',       // hsl(217 11% 23%)
    input: '#343941',
  },

  dark: {
    // Same tokens — app is dark-only
    text: '#F4F5F7',
    tint: '#D84B32',
    background: '#111315',
    foreground: '#F4F5F7',
    card: '#1B1E22',
    cardForeground: '#F4F5F7',
    elevated: '#262A2F',
    primary: '#D84B32',
    primaryForeground: '#F4F5F7',
    secondary: '#C99A2E',
    secondaryForeground: '#111315',
    muted: '#1B1E22',
    mutedForeground: '#9CA3AF',
    accent: '#262A2F',
    accentForeground: '#F4F5F7',
    destructive: '#C74D4D',
    destructiveForeground: '#F4F5F7',
    success: '#3F8F68',
    successForeground: '#F4F5F7',
    border: '#343941',
    input: '#343941',
  },

  // --radius: 0.75rem = 12px
  radius: 12,
};

export default colors;
