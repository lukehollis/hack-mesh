/**
 * This is a minimal config.
 *
 * If you need the full config, get it from here:
 * https://unpkg.com/browse/tailwindcss@latest/stubs/defaultConfig.stub.js
 */
const defaultTheme = require('tailwindcss/defaultTheme')
const plugin = require('tailwindcss/plugin')

module.exports = {
  content: [
    './src/**/*.tsx',
    './src/*.tsx',
    './src/**/*.js',
    './src/*.js',
    './src/**/*.jsx',
    './src/*.jsx',
    './src/**/*.html',
    './src/*.html',
  ],

  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        primary: '#87806C',
        secondary: '#666256',
        light: '#F2EEEA',
        accent: '#959A92',
        'theme-gray': '#C7C7C7',
        'theme-100': '#F2EEEA',
        'theme-200': '#E4E1D9',
        'theme-300': '#d5d2c9',
        'theme-400': '#c6c1b2',
        'theme-500': '#87806C',
        'theme-600': '#87806C',
        'theme-700': '#78715e',
        'theme-800': '#353431',
        'theme-900': '#1A1919',
        'prose': '#333',
      },
      fontFamily: {
        sans: ['Staff Light', ...defaultTheme.fontFamily.sans],
        "sans-bold": ['Staff Medium ', ...defaultTheme.fontFamily.sans],
        serif: ['Silk Serif', ...defaultTheme.fontFamily.serif],
        "serif-plain": "Georgia,Times New Roman,Times,serif",
      },
      height: {
        '160': '40rem',
      },
      minWidth: {
        '96': '24rem',
      },
    },
    cursor: {
      'zoom-in': 'zoom-in',
      'default': 'default',
      'pointer': 'pointer',
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    /**
     * '@tailwindcss/forms' is the forms plugin that provides a minimal styling
     * for forms. If you don't like it or have own styling for forms,
     * comment the line below to disable '@tailwindcss/forms'.
     */
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio'),
    plugin(function({ addComponents }) {
      const columns = {
        ".column-count-2": {
          "column-count": 2,
        },
        ".column-count-3": {
          "column-count": 3,
        },
        ".column-count-4": {
          "column-count": 4,
        },
        ".column-gap-4": {
          "column-gap": '4rem',
        },
        ".column-gap-3": {
          "column-gap": '3rem',
        },
        ".break-inside": {
          "break-inside": "avoid",
        },
      }

      addComponents(columns, ['responsive'])
    }),
  ],
}
