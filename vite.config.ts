import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // The code below enables dev tools like taking screenshots of your site
    // while it is being developed on stunning.so.
    mode === "development"
      ? {
          name: "inject-stunning-dev",
          transform(code: string, id: string) {
            if (id.includes("main.tsx")) {
              return {
                code: `${code}
/* Added by Vite plugin inject-stunning-dev */
window.addEventListener('message', async (message) => {
  if (message.source !== window.parent) return;
  if (message.data.type !== 'stunningPreviewRequest') return;

  const isWebContainer = window.location.hostname.includes('webcontainer-api.io');
  const workerUrl = isWebContainer
    ? 'https://builder.stunning.so/scripts/worker.bundled.mjs'
    : window.location.origin + '/scripts/worker.bundled.mjs';

const worker = await import(/* @vite-ignore */ workerUrl);
  await worker.respondToMessage(message);
});
            `,
                map: null,
              };
            }
            return null;
          },
        }
      : null,
  ].filter(Boolean),

  // ✅ تثبيت الإعدادات للسيرفر المحلي (Local Development)
  server: {
    port: 5173,
    strictPort: true, // لو بورت 5173 مشغول، السيرفر مش هيفتح بورت تاني عشوائي
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ✅ إعدادات الـ Build لضمان أن الـ Production لا يتأثر
  build: {
    outDir: "dist",
    sourcemap: mode === "development",
  },
}));
