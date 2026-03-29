/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
        body: ['Figtree', 'sans-serif'],
      },
      colors: {
        bg:      '#080810',
        s1:      '#0f0f1a',
        s2:      '#161622',
        s3:      '#1e1e2e',
        border:  'rgba(255,255,255,0.07)',
        green:   '#00f5a0',
        'green-dim': '#00c880',
        blue:    '#4d9eff',
        purple:  '#9d7cf8',
        amber:   '#fbbf24',
        red:     '#f87171',
        muted:   '#9090a8',
        dim:     '#5a5a72',
        fb:      '#1877f2',
        ig:      '#e1306c',
        wa:      '#25d366',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-in':   'slideIn 0.35s cubic-bezier(0.16,1,0.3,1)',
        'flash':      'flash 0.9s ease forwards',
        'toast-in':   'toastIn 0.4s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        slideIn:  { from:{ transform:'translateX(100%)' }, to:{ transform:'translateX(0)' } },
        flash:    { '0%':{ background:'#00f5a015', borderColor:'rgba(0,245,160,.4)' }, '100%':{ background:'transparent' } },
        toastIn:  { from:{ opacity:'0', transform:'translateX(20px)' }, to:{ opacity:'1', transform:'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
