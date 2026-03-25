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
        canvas: "#121212",
        elevated: "#1a1a1a",
        rowHover: "#202020",
        subtle: "#2a2a2a",
        ink: "#ffffff",
        prose: "#e4e4e7",
        meta: "#a0a0a0",
        link: "#6ea8fe",
        accentUser: "#79c0ff",
        accentCommunity: "#7ee2c5",
        control: "#333333",
      },
    },
  },
  plugins: [],
};

export default config;
