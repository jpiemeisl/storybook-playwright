#!/usr/bin/env node
/*
 * Part of npm run build:lib: copies the token and theme CSS into dist/tokens/ as standalone files, so a
 * consumer can import tokens/index.css (layer order, reset, tokens, every theme, base), or the default
 * tokens plus only the themes it uses.
 */
import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const from = resolve(process.cwd(), 'src', 'tokens');
const to = resolve(process.cwd(), 'dist', 'tokens');
mkdirSync(to, { recursive: true });
for (const file of ['index.css', 'reset.css', 'primitives.css', 'semantic.css', 'base.css']) cpSync(resolve(from, file), resolve(to, file));
cpSync(resolve(from, 'themes'), resolve(to, 'themes'), { recursive: true });
console.log('Copied token and theme CSS to dist/tokens/.');
