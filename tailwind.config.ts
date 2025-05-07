import type { Config } from "tailwindcss";

export default {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--theme-bg)",
        foreground: "var(--theme-fg)",
        primary: "var(--theme-primary)",
        secondary: "var(--theme-secondary)",
        accent: "var(--theme-accent)",
        success: "var(--theme-success)",
        warning: "var(--theme-warning)",
        error: "var(--theme-error)",
        info: "var(--theme-info)",
        card: "var(--theme-card)",
        border: "var(--theme-border)",
        
        // 文本颜色
        "text-secondary": "var(--theme-text-secondary)",
        "text-disabled": "var(--theme-text-disabled)",
      },
      backgroundImage: {
        'theme-gradient': "var(--theme-background)",
      },
      boxShadow: {
        'card': 'var(--theme-shadow)',
        'button': 'var(--theme-shadow-sm)',
        'hover': 'var(--theme-shadow-md)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-down': 'slideDown 0.2s ease-in-out',
        'pulse': 'pulse 2s infinite',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        spin: {
          'to': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
