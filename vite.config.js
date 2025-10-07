import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        // 주석: 'leaderboard.html'과 같은 새 페이지를 추가하려면
        // 여기에 새 항목을 추가하세요:
        // leaderboard: resolve(__dirname, 'leaderboard.html'),
      },
    },
  },
});