import { builtinModules } from "node:module";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const external = [
  "@polyhook/sdk",
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

export default defineConfig({
  build: {
    target: "node18",
    minify: false,
    lib: {
      entry: {
        index: "src/index.ts",
        cli: "src/cli.ts",
      },
      formats: ["es", "cjs"],
      fileName: (format, name) => `${name}.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external,
      output: {
        banner: (chunk) =>
          chunk.fileName.startsWith("cli") ? "#!/usr/bin/env node" : "",
      },
    },
  },
  plugins: [dts({ rollupTypes: true })],
});
