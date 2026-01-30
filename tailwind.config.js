/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // 1. Grid Architecture & Spacing
    // We extend the default spacing to ensure the 8pt (0.5rem) rhythm is prioritized.
    // Tailwind's default 1 = 0.25rem (4px), so 2 = 0.5rem (8px).
    // We will stick to using: 2 (8px), 4 (16px), 6 (24px), 8 (32px), 12 (48px), etc.
    extend: {
      spacing: {
        '18': '4.5rem', // 72px (9 * 8)
        '22': '5.5rem', // 88px (11 * 8)
      },
      // 2. Typographic Hierarchy
      // Augmented Fourth Scale (1.414)
      // Base (text-base) = 1rem (16px)
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],     // 12px (Label)
        'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px (Secondary)
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px (Body)
        'lg': ['1.414rem', { lineHeight: '2rem' }],     // 22.6px (Subhead)
        'xl': ['1.999rem', { lineHeight: '2.5rem' }],   // 32px (Section Head)
        '2xl': ['2.827rem', { lineHeight: '1.1' }],     // 45px (Page Head)
        '3xl': ['3.998rem', { lineHeight: '1.1' }],     // 64px (Display)
        '4xl': ['5.653rem', { lineHeight: '1' }],       // 90px (Hero)
      },
      // 4. Color & Decoration
      colors: {
        // Enforcing the "Functional Color Only" rule
        // Backgrounds: slate-900 (main), slate-950 (darker depth)
        // Borders: slate-700 (structural)
        // Text: slate-50 (primary), slate-400 (secondary)
        // Action: blue-600 (primary interaction)
      },
      borderRadius: {
        // Eliminate Ornament: Reset default rounded to 0 for the strict architectural look
        'none': '0px',
        'DEFAULT': '0px',
        'sm': '0px',
        'md': '0px',
        'lg': '0px',
        'xl': '0px',
        '2xl': '0px',
        '3xl': '0px',
        'full': '9999px', // Keep for status dots only
      },
      boxShadow: {
        // Eliminate Ornament: Remove default shadows
        'none': 'none',
        'DEFAULT': 'none',
      }
    },
  },
  plugins: [],
}