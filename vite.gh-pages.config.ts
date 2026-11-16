// Static build for GitHub Pages: `bun run build:gh-pages` -> dist-gh-pages/.
// Separate from vite.config.ts so the Lovable preview and publishing are untouched.
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const root = path.resolve(__dirname, "gh-pages");

export default defineConfig({
  root,
  // Relative asset paths work at https://<user>.github.io/<repo>/ for any repo name.
  base: "./",
  publicDir: path.resolve(__dirname, "public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
    dedupe: ["react", "react-dom", "@tanstack/react-router"],
  },
  server: { fs: { allow: [path.resolve(__dirname)] } },
  build: {
    outDir: path.resolve(__dirname, "dist-gh-pages"),
    emptyOutDir: true,
  },
});
