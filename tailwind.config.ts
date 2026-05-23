import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#D4460F',
          dark: '#A83409',
          light: '#F5EDE9',
          pale: '#FFF3EC',
        },
        dark: '#1C1917',
        mid: '#57534E',
        soft: '#A8A29E',
        border: '#E7E3DF',
        surface: '#FAFAF9',
        verified: '#1A7A4A',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Instrument Serif', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
