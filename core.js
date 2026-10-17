import { phrases } from './data.js';

export const faNumber = value => new Intl.NumberFormat('fa-IR').format(value);
export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export const normalize = value => value.toLocaleLowerCase('tr-TR').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/[\u200c\u200e\u200f]/g, ' ').trim();
export const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const defaultState = () => ({ learned: [], favorites: [], activity: {}, lastPhrase: null, goal: 5, rate: 0.85 });
const validIds = new Set(phrases.map(phrase => phrase.id));

export function restoreState(value) {
  try {
    const raw = JSON.parse(value);
    if (!raw || typeof raw !== 'object') return defaultState();
    const ids = key => Array.isArray(raw[key]) ? [...new Set(raw[key].filter(id => validIds.has(id)))] : [];
    const activity = {};
    if (raw.activity && typeof raw.activity === 'object') {
      for (const [key, value] of Object.entries(raw.activity)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(key) && Array.isArray(value)) activity[key] = [...new Set(value.filter(id => validIds.has(id)))];
      }
    }
    return {
      learned: ids('learned'), favorites: ids('favorites'), activity,
      lastPhrase: validIds.has(raw.lastPhrase) ? raw.lastPhrase : null,
      goal: [5, 10, 20].includes(raw.goal) ? raw.goal : 5,
      rate: [0.65, 0.85, 1].includes(raw.rate) ? raw.rate : 0.85,
    };
  } catch { return defaultState(); }
}

export function toggleFavorite(state, id) {
  if (!validIds.has(id)) return;
  state.favorites = state.favorites.includes(id) ? state.favorites.filter(value => value !== id) : [...state.favorites, id];
}

export function markLearned(state, id, date = new Date()) {
  if (!validIds.has(id)) return;
  if (!state.learned.includes(id)) state.learned.push(id);
  const key = dateKey(date);
  if (!state.activity[key]) state.activity[key] = [];
  if (!state.activity[key].includes(id)) state.activity[key].push(id);
  state.lastPhrase = id;
}

export function getStreak(state, now = new Date()) {
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  if (!state.activity[dateKey(cursor)]?.length) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (state.activity[dateKey(cursor)]?.length) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function searchPhrases(query, list = phrases) {
  const text = normalize(query);
  return text ? list.filter(phrase => normalize(`${phrase.tr} ${phrase.fa}`).includes(text)) : list;
}
