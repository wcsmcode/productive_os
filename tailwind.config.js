// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        'bg-paper': 'var(--bg-paper)',
        'bg-window': 'var(--bg-window)',
        'text-ink': 'var(--text-ink)',
        'accent-soft': 'var(--accent-soft)',
        'accent-brown': 'var(--accent-brown)',
      },
      fontFamily: {
        'system': ['JetBrains Mono', 'monospace'],
        'display': ['Black Ops One', 'cursive'],
      },
    },
  },
}