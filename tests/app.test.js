import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';

// DOM-only integration tests do not launch a browser or execute a speech engine.
test('learning app interactions in a lightweight DOM', async t => {
  const { window, document } = parseHTML(await readFile(new URL('../index.html', import.meta.url), 'utf8'));
  const saved = new Map();
  const speech = {
    voices: [{ lang: 'tr-TR', name: 'Turkish test voice' }],
    current: null,
    getVoices() { return this.voices; },
    cancel() {},
    speak(utterance) { this.current = utterance; utterance.onstart?.(); },
  };
  let focused = document.body;
  Object.defineProperty(document, 'activeElement', { get: () => focused?.isConnected ? focused : document.body });
  window.HTMLElement.prototype.focus = function () { focused = this; };
  window.scrollTo = () => {};
  window.confirm = () => false;
  window.matchMedia = () => ({ matches: false });
  window.speechSynthesis = speech;
  const dialog = document.querySelector('dialog');
  dialog.open = false;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; };
  Object.assign(globalThis, {
    window, document, speechSynthesis: speech,
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    localStorage: { getItem: key => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) },
    location: { protocol: 'https:' },
  });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
  await import('../app.js');
  const click = selector => {
    const element = document.querySelector(selector);
    assert.ok(element, `Missing ${selector}`);
    assert.ok(!element.disabled, `Disabled ${selector}`);
    element.dispatchEvent(new window.Event('click', { bubbles: true }));
  };
  const stored = () => JSON.parse(saved.get('ravan-state-v1'));
  const input = text => {
    const element = document.querySelector('#category-search');
    element.value = text;
    element.dispatchEvent(new window.Event('input', { bubbles: true }));
  };

  await t.test('home shows ten categories with real zero-state progress', () => {
    assert.equal(document.querySelectorAll('.category-card').length, 10);
    assert.match(document.querySelector('.goal-ring').textContent, /۰/);
    assert.equal(document.querySelectorAll('.nav-link').length, 4);
  });
  await t.test('category opens bilingual flashcard; learning advances and persists', () => {
    click('[data-action="open-category"][data-id="restaurant"]');
    assert.equal(dialog.open, true);
    assert.equal(document.querySelector('.turkish-phrase').textContent, 'İki kişilik bir masa var mı?');
    assert.equal(document.querySelector('.persian-phrase').textContent, 'برای دو نفر میز دارید؟');
    click('[data-action="favorite"]');
    assert.deepEqual(stored().favorites, ['restaurant-1']);
    click('[data-action="learn"]');
    assert.deepEqual(stored().learned, ['restaurant-1']);
    assert.equal(document.querySelector('.turkish-phrase').textContent, 'Menüyü alabilir miyim?');
    click('[data-action="previous"]');
    assert.ok(document.querySelector('.learned-badge'));
  });
  await t.test('normal and slow speech request Turkish with the configured rates', () => {
    click('[data-action="play"]');
    assert.equal(speech.current.lang, 'tr-TR');
    assert.equal(speech.current.rate, 0.85);
    assert.equal(speech.current.text, 'İki kişilik bir masa var mı?');
    assert.ok(document.querySelector('#play-audio').classList.contains('playing'));
    speech.current.onend();
    assert.ok(!document.querySelector('#play-audio').classList.contains('playing'));
    click('[data-action="play-slow"]');
    assert.equal(speech.current.rate, 0.65);
  });
  await t.test('missing Turkish voice displays a useful message without a wrong-language fallback', () => {
    speech.voices = [];
    speech.current = null;
    click('[data-action="play"]');
    assert.equal(speech.current, null);
    assert.match(document.querySelector('#audio-hint').textContent, /Türkçe/);
    speech.voices = [{ lang: 'tr-TR', name: 'Turkish test voice' }];
  });
  await t.test('native speech bridge tracks only current utterance callbacks', () => {
    let token;
    window.AndroidSpeech = { stop() {}, speak(text, rate, id) { token = id; return true; } };
    click('[data-action="play"]');
    window.onNativeSpeechStatus('start', token);
    assert.ok(document.querySelector('#play-audio').classList.contains('playing'));
    window.onNativeSpeechStatus('done', 'old-token');
    assert.ok(document.querySelector('#play-audio').classList.contains('playing'));
    window.onNativeSpeechStatus('done', token);
    assert.ok(!document.querySelector('#play-audio').classList.contains('playing'));
    delete window.AndroidSpeech;
  });
  await t.test('Android back hook closes a lesson and updates home progress', () => {
    assert.equal(window.closeRavanLesson(), true);
    assert.equal(dialog.open, false);
    assert.equal(window.closeRavanLesson(), false);
    assert.match(document.querySelector('.category-card[data-id="restaurant"]').textContent, /۱ یادگرفته/);
  });
  await t.test('home shows one unified list of ten situations without search or group filters', () => {
    assert.equal(document.querySelectorAll('.category-card').length, 10);
    assert.equal(document.querySelector('.search-box'), null);
    assert.equal(document.querySelector('.filter-row'), null);
    assert.equal(document.querySelectorAll('[data-action="filter"]').length, 0);
  });
  await t.test('random sample opens a phrase from any category and labels its category', () => {
    const originalRandom = Math.random;
    Math.random = () => 0.99;
    click('[data-action="sample"]');
    assert.equal(dialog.open, true);
    assert.equal(document.querySelector('.lesson-position').textContent.includes('۱ از ۱'), true);
    assert.match(document.querySelector('.phrase-category').textContent, /دسته:/);
    click('[data-action="close-lesson"]');
    Math.random = originalRandom;
  });
  await t.test('saved flashcards remain reviewable and can be removed', () => {
    click('[data-action="navigate"][data-page="favorites"]');
    assert.equal(document.querySelectorAll('.phrase-row').length, 1);
    click('[data-action="review-favorites"]');
    assert.equal(dialog.open, true);
    click('#lesson-content [data-action="favorite"]');
    click('[data-action="close-lesson"]');
    assert.equal(document.querySelectorAll('.phrase-row').length, 0);
    assert.ok(document.querySelector('.empty-state'));
    assert.deepEqual(stored().favorites, []);
  });
  await t.test('statistics reflect learning, not placeholder numbers', () => {
    click('[data-action="navigate"][data-page="progress"]');
    assert.equal(document.querySelector('.stat-card strong').textContent, '۱');
    assert.equal(document.querySelectorAll('.chart-column').length, 7);
    assert.equal(document.querySelectorAll('.progress-category').length, 10);
  });
  await t.test('settings persist and reset requires confirmation', () => {
    click('[data-action="navigate"][data-page="settings"]');
    assert.equal(document.querySelector('.page-title h1')?.textContent, 'یه یادگیری شخصی‌تر');
    assert.equal(document.body.textContent.includes('همراه همیشگی تو'), false);
    assert.equal(document.body.textContent.includes('افزودن به صفحه اصلی'), false);
    click('[data-action="goal"][data-value="10"]');
    click('[data-action="rate"][data-value="1"]');
    assert.equal(stored().goal, 10);
    assert.equal(stored().rate, 1);
    click('[data-action="reset"]');
    assert.equal(stored().learned.length, 1);
    window.confirm = () => true;
    click('[data-action="reset"]');
    assert.equal(stored().learned.length, 0);
    assert.equal(stored().goal, 5);
  });
});
