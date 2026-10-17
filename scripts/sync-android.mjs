import { mkdir, copyFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'android/app/build/generated/ravanAssets');
const files = ['index.html', 'styles.css', 'app.js', 'core.js', 'data.js', 'manifest.webmanifest', 'sw.js'];
const assets = (await readdir(join(root, 'assets'))).filter(name => /\.(ttf|svg|png)$/.test(name));
await mkdir(join(target, 'assets'), { recursive: true });
for (const name of [...files, ...assets.map(name => `assets/${name}`)]) {
  await copyFile(join(root, name), join(target, name));
}
console.log(`Android assets ready: ${files.length + assets.length} files.`);
