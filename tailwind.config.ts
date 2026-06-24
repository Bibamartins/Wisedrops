import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- shadcn/ui CSS Variable tokens ---
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // --- WiseDrops Brand (laranja) ---
        // brand-500 não deve ser usado em texto < 18pt (WCAG AA falha — ratio 3.0:1)
        // Mínimo para texto: brand-700 (#c2410c, ratio 5.74:1)
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // fills/decorativo APENAS — nunca texto < 18pt
          600: '#ea580c',  // botão primário bg, hover
          700: '#c2410c',  // texto brand mínimo (WCAG AA: 5.74:1)
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },

        // --- Sage (verde-sálvia) — usado como cor secundária da marca ---
        sage: {
          50:  '#f4f7f4',
          100: '#e6ede6',
          200: '#cdd9cd',
          300: '#aabfaa',
          400: '#7a9a7a',
          500: '#5b7d5b',  // texto sage (WCAG AA: 5.1:1 sobre branco)
          600: '#486448',  // texto sage elevado
          700: '#3a4f3a',  // heading sage
          800: '#303f30',
          900: '#283428',
        },

        // --- accent: mantido como alias do sage (compatibilidade) ---
        // DEFAULT e foreground vêm das CSS vars (shadcn/Radix)
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          50:  '#f4f7f4',
          100: '#e6ede6',
          200: '#cdd9cd',
          300: '#aabfaa',
          400: '#7a9a7a',
          500: '#5b7d5b',
          600: '#486448',
          700: '#3a4f3a',
          800: '#303f30',
          900: '#283428',
        },

        // --- Surface (neutro quente) ---
        surface: {
          50:  '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },

        // --- Semânticos (status clínico, calibrados WCAG AA) ---
        success: {
          DEFAULT: '#15803d',  // -700 — seguro em texto
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
        },
        warning: {
          DEFAULT: '#b45309',  // -700
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#dc6803',
          700: '#b45309',
        },
        error: {
          DEFAULT: '#b42318',  // -700
          50:  '#fef3f2',
          100: '#fee4e2',
          500: '#f04438',
          600: '#d92d20',
          700: '#b42318',
        },
        info: {
          DEFAULT: '#175cd3',  // -700
          50:  '#eff8ff',
          100: '#d1e9ff',
          500: '#2e90fa',
          600: '#1570ef',
          700: '#175cd3',
        },
      },

      fontFamily: {
        sans:    ['DM Sans',  'system-ui', 'sans-serif'],
        heading: ['Sora',     'system-ui', 'sans-serif'],
      },

      fontSize: {
        // Escala editorial completa (v2)
        'display':  ['3rem',     { lineHeight: '1.1',  letterSpacing: '-0.03em',  fontWeight: '700' }],
        'h1':       ['2rem',     { lineHeight: '1.2',  letterSpacing: '-0.02em',  fontWeight: '600' }],
        'h2':       ['1.5rem',   { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '600' }],
        'h3':       ['1.25rem',  { lineHeight: '1.3',  letterSpacing: '-0.01em',  fontWeight: '600' }],
        'h4':       ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.005em', fontWeight: '500' }],
        'body-lg':  ['1.0625rem',{ lineHeight: '1.65', letterSpacing: '0em',      fontWeight: '400' }],
        'body':     ['1rem',     { lineHeight: '1.6',  letterSpacing: '0em',      fontWeight: '400' }],
        'small':    ['0.875rem', { lineHeight: '1.5',  letterSpacing: '0.01em',   fontWeight: '400' }],
        'caption':  ['0.75rem',  { lineHeight: '1.45', letterSpacing: '0.02em',   fontWeight: '400' }],
        'label':    ['0.875rem', { lineHeight: '1.2',  letterSpacing: '0.02em',   fontWeight: '500' }],
        'overline': ['0.6875rem',{ lineHeight: '1.3',  letterSpacing: '0.08em',   fontWeight: '600' }],
      },

      borderRadius: {
        sm:     '4px',
        DEFAULT:'6px',
        md:     '8px',
        lg:     '12px',   // == --radius: 0.75rem
        xl:     '16px',
        '2xl':  '20px',
        full:   '9999px',
      },

      boxShadow: {
        xs:           '0 1px 2px 0 rgba(0,0,0,0.04)',
        sm:           '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        md:           '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)',
        lg:           '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.04)',
        xl:           '0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04)',
        'focus-brand':'0 0 0 3px rgba(249,115,22,0.18)',
        'focus-sage': '0 0 0 3px rgba(91,125,91,0.18)',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'modal-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'modal-out': {
          from: { opacity: '1', transform: 'translateY(0) scale(1)' },
          to:   { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(calc(100% + 16px))' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'slide-in':       'slide-in 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-up':       'slide-up 0.2s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':        'fade-in 0.2s ease-out',
        'modal-in':       'modal-in 0.2s cubic-bezier(0.16,1,0.3,1)',
        'modal-out':      'modal-out 0.15s ease-in',
        'toast-in':       'toast-in 0.3s cubic-bezier(0.16,1,0.3,1)',
      },

      transitionDuration: {
        '80':  '80ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
}

export default config
