import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    nodePolyfills({
      // (KO) 전역 Buffer를 폴리필할지 여부. 이것이 핵심입니다.
      // (EN) Whether to polyfill `Buffer`. This is the key.
      globals: {
        Buffer: true, // --> this enables Buffer polyfill
        global: true,
        process: true,
      },
      // (KO) 특정 프로토콜(예: 'http', 'https')을 폴리필할지 여부
      // (EN) Whether to polyfill specific protocols.
      protocolImports: true,
    }),
  ],
});