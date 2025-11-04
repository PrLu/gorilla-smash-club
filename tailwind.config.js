const tokens = require('./src/styles/tokens.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable dark mode via class strategy
  theme: {
    extend: {
      colors: {
        // Brand colors from Gorilla Smash Club logo
        primary: tokens.colors.light.primary,
        accent: tokens.colors.light.accent,
        secondary: tokens.colors.light.secondary,
        highlight: tokens.colors.light.highlight,
        success: tokens.colors.light.success,
        warning: tokens.colors.light.warning,
        error: tokens.colors.light.error,
        gray: tokens.colors.light.gray,
        
        // Dark mode variants (automatically applied with dark: prefix)
        dark: {
          primary: tokens.colors.dark.primary,
          accent: tokens.colors.dark.accent,
          secondary: tokens.colors.dark.secondary,
        },
      },
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      fontFamily: {
        display: tokens.fontFamily.display,
        sans: tokens.fontFamily.sans,
        mono: tokens.fontFamily.mono,
      },
      fontSize: tokens.fontSize,
      transitionDuration: {
        fast: tokens.motion.duration.fast,
        normal: tokens.motion.duration.normal,
        slow: tokens.motion.duration.slow,
      },
      transitionTimingFunction: {
        default: tokens.motion.easing.default,
      },
    },
  },
  plugins: [],
};
