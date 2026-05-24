/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Pretendard', 'Noto Sans KR', 'system-ui', 'sans-serif'],
      },
      colors: {
        command: {
          bg: '#07110f',
          panel: '#0e1a17',
          line: '#1f3a34',
          mint: '#70f0c8',
          amber: '#f6c653',
          red: '#ff5d5d',
        },
      },
    },
  },
  plugins: [],
};
