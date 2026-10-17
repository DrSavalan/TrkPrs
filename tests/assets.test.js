import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);

test('install manifest and icon dimensions are valid', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', root), 'utf8'));
  assert.equal(manifest.lang, 'fa');
  assert.equal(manifest.dir, 'rtl');
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const buffer = await readFile(new URL(icon.src, root));
    if (icon.type === 'image/png') {
      assert.equal(buffer.subarray(1, 4).toString(), 'PNG');
      const size = Number(icon.sizes.split('x')[0]);
      assert.equal(buffer.readUInt32BE(16), size);
      assert.equal(buffer.readUInt32BE(20), size);
    }
  }
});

test('offline worker caches all delivered app files and isolates its scope', async () => {
  const listeners = {};
  let cachedFiles = [];
  const deleted = [];
  const matched = [];
  let networkFails = false;
  let claimed = false;
  const context = {
    URL,
    self: { registration: { scope: 'https://ravan.test/learn/' }, addEventListener: (type, listener) => { listeners[type] = listener; }, clients: { claim: async () => { claimed = true; } } },
    caches: {
      open: async () => ({ addAll: async files => { cachedFiles = Array.from(files); } }),
      keys: async () => ['ravan-offline-v1', 'ravan-offline-old', 'another-app'],
      delete: async key => { deleted.push(key); },
      match: async request => { matched.push(String(request.url || request)); return 'cached-response'; },
    },
    fetch: async () => { if (networkFails) throw new Error('Offline'); return 'network-response'; },
  };
  vm.runInNewContext(await readFile(new URL('sw.js', root), 'utf8'), context);
  let waiting;
  listeners.install({ waitUntil(promise) { waiting = promise; } });
  await waiting;
  assert.ok(cachedFiles.includes('./assets/vazirmatn-bold.ttf'));
  for (const path of cachedFiles) await access(new URL(path, root));
  listeners.activate({ waitUntil(promise) { waiting = promise; } });
  await waiting;
  assert.deepEqual(deleted, ['ravan-offline-old']);
  assert.ok(claimed);
  const dispatch = async request => {
    let response;
    listeners.fetch({ request, respondWith(promise) { response = promise; } });
    return response === undefined ? undefined : await response;
  };
  assert.equal(await dispatch({ url: 'https://ravan.test/learn/data.js', method: 'GET', mode: 'cors' }), 'cached-response');
  assert.equal(await dispatch({ url: 'https://another.test/data.js', method: 'GET', mode: 'cors' }), undefined);
  assert.equal(await dispatch({ url: 'https://ravan.test/private', method: 'GET', mode: 'cors' }), undefined);
  assert.equal(await dispatch({ url: 'https://ravan.test/learn/', method: 'GET', mode: 'navigate' }), 'network-response');
  networkFails = true;
  assert.equal(await dispatch({ url: 'https://ravan.test/learn/', method: 'GET', mode: 'navigate' }), 'cached-response');
  assert.equal(matched.at(-1), 'https://ravan.test/learn/index.html');
});

test('Android wrapper restricts content to local assets and uses Turkish TTS', async () => {
  const kotlin = await readFile(new URL('android/app/src/main/java/ir/ravan/app/MainActivity.kt', root), 'utf8');
  const manifest = await readFile(new URL('android/app/src/main/AndroidManifest.xml', root), 'utf8');
  assert.match(kotlin, /allowFileAccess = false/);
  assert.match(kotlin, /allowContentAccess = false/);
  assert.match(kotlin, /blockNetworkLoads = true/);
  assert.match(kotlin, /Locale.forLanguageTag\("tr-TR"\)/);
  assert.match(kotlin, /speech.shutdown\(\)/);
  assert.doesNotMatch(manifest, /uses-permission/);
  assert.match(manifest, /TTS_SERVICE/);
});
