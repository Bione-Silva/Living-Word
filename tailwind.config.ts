import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ['"Montserrat"', 'sans-serif'],
        body: ['"Montserrat"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        serif: ['Georgia', '"Playfair Display"', 'serif'],
      },
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        lw: {
          cafe: "hsl(256, 56%, 16%)",      /* Scripture Dark */
          dark: "hsl(261, 41%, 7%)",       /* Night Canvas */
          amber: "hsl(263, 70%, 50%)",     /* Word Primary (kept name for compat) */
          gold: "hsl(43, 80%, 46%)",       /* Sacred Gold */
          parchment: "hsl(47, 77%, 83%)",  /* Parchment */
          cream: "hsl(240, 50%, 99%)",     /* Divine White */
        },
        sacred: {
          gold: "hsl(43, 80%, 46%)",       /* Sacred Gold */
          parchment: "hsl(47, 77%, 83%)",  /* Parchment */
          lavender: "hsl(281, 62%, 90%)",  /* Soft Lavender */
          divine: "hsl(240, 50%, 99%)",    /* Divine White */
          stone: "hsl(215, 28%, 17%)",     /* Stone Gray */
          covenant: "hsl(257, 61%, 32%)",  /* Covenant */
          spirit: "hsl(258, 90%, 66%)",    /* Spirit Light */
          word: "hsl(263, 70%, 50%)",      /* Word Primary */
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
