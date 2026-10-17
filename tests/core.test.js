import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, phrases } from '../data.js';
import { dateKey, defaultState, escapeHtml, getStreak, markLearned, normalize, restoreState, searchPhrases, toggleFavorite } from '../core.js';

const day = value => new Date(`${value}T12:00:00`);

test('ten categories contain exactly twenty bilingual sentences each', () => {
  assert.equal(categories.length, 10);
  assert.equal(phrases.length, 200);
  assert.equal(new Set(categories.map(category => category.id)).size, 10);
  assert.equal(new Set(phrases.map(phrase => phrase.id)).size, 200);
  for (const category of categories) {
    assert.equal(category.phrases.length, 20, category.id);
    assert.equal(new Set(category.phrases.map(([tr]) => tr)).size, 20);
    for (const pair of category.phrases) {
      assert.equal(pair.length, 2);
      for (const sentence of pair) {
        assert.ok(sentence.trim().length > 0);
        assert.ok(sentence.trim().split(/\s+/).length <= 20, sentence);
      }
      assert.match(pair[1], /[آ-ی]/);
    }
  }
});

test('all phrases map to a real category', () => {
  for (const phrase of phrases) assert.ok(categories.some(category => category.id === phrase.categoryId));
});

test('Turkish and Persian search normalize language variants', () => {
  assert.equal(normalize('İSTANBUL'), 'istanbul');
  assert.equal(normalize('كجا'), 'کجا');
  assert.ok(searchPhrases('رستوران').length === 0);
  assert.ok(searchPhrases('Menü').some(phrase => phrase.id === 'restaurant-2'));
  assert.ok(searchPhrases('كارت').length > 0);
  assert.equal(searchPhrases('').length, 200);
  assert.equal(searchPhrases('no-such-sentence').length, 0);
});

test('saved state survives a JSON round trip', () => {
  const state = defaultState();
  markLearned(state, 'airport-1', day('2026-10-17'));
  toggleFavorite(state, 'hotel-2');
  state.goal = 10;
  state.rate = 0.65;
  assert.deepEqual(restoreState(JSON.stringify(state)), state);
});

test('corrupt or unrecognized stored values safely reset', () => {
  for (const value of [null, '', '{broken', 'null', 'false', '2']) assert.deepEqual(restoreState(value), defaultState());
  const state = restoreState(JSON.stringify({ learned: ['bad-id', 'hotel-1', 'hotel-1'], favorites: [null, 'airport-1'], activity: { 'bad-key': ['hotel-1'], '2026-10-17': ['hotel-1', 'hotel-1', 'bad'] }, goal: 99, rate: -1, lastPhrase: 'bad' }));
  assert.deepEqual(state.learned, ['hotel-1']);
  assert.deepEqual(state.favorites, ['airport-1']);
  assert.deepEqual(state.activity, { '2026-10-17': ['hotel-1'] });
  assert.equal(state.goal, 5);
  assert.equal(state.rate, 0.85);
  assert.equal(state.lastPhrase, null);
});

test('learning is unique per day but reviews count on subsequent days', () => {
  const state = defaultState();
  markLearned(state, 'hotel-1', day('2026-10-17'));
  markLearned(state, 'hotel-1', day('2026-10-17'));
  markLearned(state, 'hotel-1', day('2026-10-18'));
  markLearned(state, 'invalid', day('2026-10-18'));
  assert.deepEqual(state.learned, ['hotel-1']);
  assert.deepEqual(state.activity['2026-10-17'], ['hotel-1']);
  assert.deepEqual(state.activity['2026-10-18'], ['hotel-1']);
  assert.equal(state.lastPhrase, 'hotel-1');
});

test('favorites toggle and reject unknown phrase IDs', () => {
  const state = defaultState();
  toggleFavorite(state, 'restaurant-1');
  assert.deepEqual(state.favorites, ['restaurant-1']);
  toggleFavorite(state, 'invalid');
  toggleFavorite(state, 'restaurant-1');
  assert.deepEqual(state.favorites, []);
});

test('streak includes consecutive days and handles a pending today', () => {
  const state = defaultState();
  assert.equal(getStreak(state, day('2026-10-17')), 0);
  for (const date of ['2026-10-15', '2026-10-16', '2026-10-17']) markLearned(state, 'greetings-1', day(date));
  assert.equal(getStreak(state, day('2026-10-17')), 3);
  assert.equal(getStreak(state, day('2026-10-18')), 3);
  assert.equal(getStreak(state, day('2026-10-19')), 0);
});

test('streak crosses month and year boundaries', () => {
  const state = defaultState();
  markLearned(state, 'daily-1', day('2026-12-31'));
  markLearned(state, 'daily-2', day('2027-01-01'));
  assert.equal(getStreak(state, day('2027-01-01')), 2);
  assert.equal(dateKey(day('2027-01-01')), '2027-01-01');
});

test('dynamic content escapes HTML injection', () => {
  assert.equal(escapeHtml('<img src="x" onerror=\'alert(1)\'>&'), '&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;&amp;');
});
