import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fef7ee",
          100: "#fdedd6",
          200: "#fad7ac",
          300: "#f6ba77",
          400: "#f19340",
          500: "#ed751a",
          600: "#de5b10",
          700: "#b84410",
          800: "#933615",
          900: "#772e14",
          950: "#401508",
        },
      },
    },
  },
  plugins: [],
};
export default config;