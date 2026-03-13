import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#09090b",
          card: "#18181b",
          border: "#27272a",
          hover: "#1f1f23",
        },
        accent: {
          violet: "#7c3aed",
          "violet-light": "#8b5cf6",
          blue: "#3b82f6",
          "blue-light": "#60a5fa",
        },
        category: {
          "voice-ai": "#7c3aed",
          "use-case": "#3b82f6",
          "market-intel": "#f59e0b",
          cx: "#22c55e",
          "ai-news": "#f43f5e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
