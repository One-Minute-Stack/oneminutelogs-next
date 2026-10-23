import { defineConfig } from 'tsup';
export default defineConfig([
  { entry: ['src/index.ts'], noExternal: [/^@oneminutelogs\/browser\/server$/], format: ['cjs'], dts: true, splitting: false, target: 'node18' },
  { entry: ['src/dashboard.tsx'], format: ['esm'], dts: true, splitting: false, target: 'node18',
    loader: { '.css': 'local-css' }, banner: { js: '"use client";' }, footer: { js: 'import "./dashboard.css";' } },
  { entry: ['src/admin.ts'], format: ['cjs'], dts: true, splitting: false, target: 'node18', banner: { js: '"use client";' } },
]);
