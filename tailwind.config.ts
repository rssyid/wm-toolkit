import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        status: {
          planned: {
            bg: "rgb(241 245 249)",
            text: "rgb(71 85 105)",
            border: "rgb(203 213 225)",
            darkBg: "rgb(30 41 59)",
            darkText: "rgb(148 163 184)",
            darkBorder: "rgb(51 65 85)",
          },
          inProgress: {
            bg: "rgb(239 246 255)",
            text: "rgb(29 78 216)",
            border: "rgb(191 219 254)",
            darkBg: "rgb(30 58 138 / 0.4)",
            darkText: "rgb(147 197 253)",
            darkBorder: "rgb(30 64 175 / 0.6)",
          },
          onHold: {
            bg: "rgb(254 243 199)",
            text: "rgb(180 83 9)",
            border: "rgb(253 230 138)",
            darkBg: "rgb(120 53 15 / 0.4)",
            darkText: "rgb(252 211 77)",
            darkBorder: "rgb(180 83 9 / 0.6)",
          },
          completed: {
            bg: "rgb(240 253 244)",
            text: "rgb(21 128 61)",
            border: "rgb(187 247 208)",
            darkBg: "rgb(20 83 45 / 0.4)",
            darkText: "rgb(134 239 172)",
            darkBorder: "rgb(22 101 52 / 0.6)",
          },
          rejected: {
            bg: "rgb(254 242 242)",
            text: "rgb(185 28 28)",
            border: "rgb(254 202 202)",
            darkBg: "rgb(127 29 29 / 0.4)",
            darkText: "rgb(252 165 165)",
            darkBorder: "rgb(153 27 27 / 0.6)",
          },
          pending: {
            bg: "rgb(254 252 232)",
            text: "rgb(161 98 7)",
            border: "rgb(254 240 138)",
            darkBg: "rgb(113 63 18 / 0.4)",
            darkText: "rgb(253 224 71)",
            darkBorder: "rgb(133 77 14 / 0.6)",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
