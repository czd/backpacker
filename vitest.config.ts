import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirrors tsconfig.json `"@/*": ["./*"]` so component tests resolve
      // imports the same way the Next build does.
      "@": rootDir,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["app/**/*.{test,spec}.{ts,tsx}", "test/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
  },
});
