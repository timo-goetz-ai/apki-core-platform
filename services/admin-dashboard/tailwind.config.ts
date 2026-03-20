import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── shadcn-compatible semantic tokens (reference CSS vars) ─────────
        background:  'var(--layer-0)',
        foreground:  'var(--text-primary)',
        card: {
          DEFAULT:    'var(--layer-2)',
          foreground: 'var(--text-primary)',
        },
        popover: {
          DEFAULT:    'var(--layer-2)',
          foreground: 'var(--text-primary)',
        },
        primary: {
          DEFAULT:    'var(--accent-blue)',
          foreground: 'var(--layer-0)',
        },
        secondary: {
          DEFAULT:    'var(--layer-3)',
          foreground: 'var(--text-secondary)',
        },
        muted: {
          DEFAULT:    'var(--layer-3)',
          foreground: 'var(--text-muted)',
        },
        accent: {
          DEFAULT:    'var(--layer-3)',
          foreground: 'var(--text-primary)',
        },
        destructive: {
          DEFAULT:    'var(--accent-red)',
          foreground: '#ffffff',
        },
        border:  'var(--border)',
        input:   'var(--border-bright)',
        ring:    'var(--accent-blue)',

        // ── Status semantic colors ─────────────────────────────────────────
        success: 'var(--accent-green)',
        warning: 'var(--accent-amber)',
        error:   'var(--accent-red)',
        info:    'var(--accent-blue)',

        // ── Brand ──────────────────────────────────────────────────────────
        brand: {
          50:  "#f0f9ff",
          500: "#0ea5e9",
          600: "#0284c7",
          900: "#0c4a6e",
        },
      },
      fontFamily: {
        sans: ['var(--font-ui)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm:  'calc(var(--radius) - 4px)',
        md:  'calc(var(--radius) - 2px)',
        lg:  'var(--radius)',
        xl:  'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        'zoom-in': { from: { transform: 'scale(0.95)' }, to: { transform: 'scale(1)' } },
        'zoom-out': { from: { transform: 'scale(1)' }, to: { transform: 'scale(0.95)' } },
        'glow-pulse': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in-0': 'fade-in 0.15s ease-out',
        'fade-out-0': 'fade-out 0.15s ease-out',
        'zoom-in-95': 'zoom-in 0.15s ease-out',
        'zoom-out-95': 'zoom-out 0.15s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
