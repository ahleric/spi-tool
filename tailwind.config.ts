import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-grotesk)", "var(--font-inter)", "sans-serif"],
      },
      colors: {
        brand: {
          // Spotify-inspired green palette
          primary: "#1DB954",
          secondary: "#15803d",
          accent: "#22c55e",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(29, 185, 84, 0.28)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "button-glow": {
          "0%, 100%": {
            boxShadow: "0 0 24px rgba(29, 185, 84, 0.25)",
            transform: "translateY(0)",
          },
          "50%": {
            boxShadow: "0 0 40px rgba(29, 185, 84, 0.45)",
            transform: "translateY(-1px)",
          },
        },
      },
      animation: {
        fadeIn: "fadeIn 200ms ease-out",
        "button-glow": "button-glow 1800ms ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
