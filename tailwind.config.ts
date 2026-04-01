import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2fbfa",
          100: "#d3f5f1",
          200: "#a8e9e3",
          300: "#77d8d1",
          400: "#46bfb8",
          500: "#269f99",
          600: "#1d817c",
          700: "#1b6865",
          800: "#1a5250",
          900: "#184443"
        },
        sand: "#f6f1e8",
        ink: "#17202a"
      },
      boxShadow: {
        panel: "0 14px 40px rgba(23, 32, 42, 0.08)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;

