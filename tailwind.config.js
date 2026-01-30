/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",        // 核心：扫描根目录下的 App.tsx 等
    "./src/**/*.{js,ts,jsx,tsx}",  // 扫描 src 目录
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}