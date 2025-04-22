import type { Config } from 'tailwindcss';

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Нейтральная светлая палитра
        neutral: {
          50: "#FFFFFF",
          100: "#FAFAFA",
          200: "#F2F2F7",
          300: "#E5E5EA",
          400: "#D1D1D6",
          500: "#AEAEB2",
          600: "#8E8E93",
          700: "#636366",
          800: "#3A3A3C",
          900: "#1C1C1E",
        },
        // Акцентный цвет
        primary: {
          DEFAULT: "#0070F3",
          light: "#66B2FF",
          dark: "#0051A8",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 3px rgba(0, 0, 0, 0.1)",
        card: "0 4px 12px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "8px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/line-clamp"),
  ],
};
