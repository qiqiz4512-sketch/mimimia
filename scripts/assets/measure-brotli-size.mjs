#!/usr/bin/env node

import { brotliCompressSync, constants } from 'node:zlib';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const DIST_ROOT = path.join(ROOT, 'dist');
const LIMIT_BYTES = 15 * 1024 * 1024;
const categories = new Map([
  ['program', { label: '程序', raw: 0, brotli: 0 }],
  ['style', { label: '样式', raw: 0, brotli: 0 }],
  ['font', { label: '字体', raw: 0, brotli: 0 }],
  ['girl', { label: '少女', raw: 0, brotli: 0 }],
  ['cat', { label: '灵猫', raw: 0, brotli: 0 }],
  ['sound', { label: '声音', raw: 0, brotli: 0 }],
  ['other', { label: '其他', raw: 0, brotli: 0 }],
]);

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(absolute));
    else if (entry.isFile()) output.push(absolute);
  }
  return output;
}

function categoryFor(relativePath) {
  if (relativePath.includes('/characters/magical-girl/')) return 'girl';
  if (relativePath.includes('/characters/moon-cat/')) return 'cat';
  if (relativePath.includes('/audio/')) return 'sound';
  if (/\.(?:js|mjs)$/u.test(relativePath)) return 'program';
  if (/\.css$/u.test(relativePath)) return 'style';
  if (/\.(?:woff2?|ttf|otf)$/u.test(relativePath)) return 'font';
  return 'other';
}

for (const filePath of await walk(DIST_ROOT)) {
  const data = await readFile(filePath);
  const compressed = brotliCompressSync(data, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  });
  const relativePath = `/${path.relative(DIST_ROOT, filePath).split(path.sep).join('/')}`;
  const category = categories.get(categoryFor(relativePath));
  category.raw += data.byteLength;
  category.brotli += compressed.byteLength;
}

let total = 0;
console.log('首次可用路径体积预检（本地逐文件 Brotli）：');
for (const category of categories.values()) {
  total += category.brotli;
  console.log(`${category.label}: 原始 ${(category.raw / 1024 / 1024).toFixed(2)} MB；Brotli ${(category.brotli / 1024 / 1024).toFixed(2)} MB`);
}
console.log(`合计: ${(total / 1024 / 1024).toFixed(2)} MB / 15.00 MB`);
if (total > LIMIT_BYTES) throw new Error('首次可用路径压缩体积超过 15 MB');
