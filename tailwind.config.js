/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        prada: {
          black: "#0a0a0a",
          dark: "#141414",
          card: "#18181b",
          border: "#27272a",
          lightBorder: "#e4e4e7",
          white: "#ffffff",
          offwhite: "#fafafa",
          subtle: "#71717a",
          gold: "#d4af37",
          goldHover: "#b89628",
          red: "#e11d48",
          green: "#10b981",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      letterSpacing: {
        prada: "0.25em",
        pradaWide: "0.35em",
      },
    },
  },
  plugins: [],
};
