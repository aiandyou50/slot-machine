import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  // Korean: 빌드 결과물이 저장될 경로를 'public'으로 지정합니다.
  // English: Specifies the output directory for the build result as 'public'.
  build: {
    outDir: 'public',
    emptyOutDir: true,
  },
  // Korean: Cloudflare Pages 배포를 위한 설정
  // English: Configuration for Cloudflare Pages deployment
  base: '/',
  plugins: [
    // Korean: Node.js 폴리필 플러그인을 여기에 추가합니다.
    // English: Add the Node.js polyfills plugin here.
    nodePolyfills(),
  ],
});