import { categories, phrases } from './data.js';
import { faNumber as n, escapeHtml as e, normalize, dateKey, restoreState, toggleFavorite, markLearned, getStreak, searchPhrases } from './core.js';

const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  chart: '<path d="M4 3v17h17M9 15v-4m5 4V7m5 8V4"/>',
  settings: '<path d="m9 3-.5 2-2 .9-1.9-.5-2 3.4L4 10.3v2.4l-1.4 1.5 2 3.4 1.9-.5 2 .9.5 2h4l.5-2 2-.9 1.9.5 2-3.4-1.4-1.5v-2.4l1.4-1.5-2-3.4-1.9.5-2-.9L13 3Z"/><circle cx="11" cy="11.5" r="3"/>',
  flame: '<path d="M12 3c1 5-4 5-4 9 0 2 1 3 2 3-1-4 4-4 4-7 3 3 5 6 4 9a7 7 0 0 1-13-1c-1-5 3-7 7-13Z"/>',
  arrow: '<path d="M19 12H5m7-7-7 7 7 7"/>',
  chevron: '<path d="m14 6-6 6 6 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  utensils: '<path d="M4 3v6a3 3 0 0 0 6 0V3M7 3v19M20 22V3c-4 1-5 6-5 10h5"/>',
  plane: '<path d="m22 2-7 20-4-9-9-4 20-7ZM11 13 22 2"/>',
  bed: '<path d="M3 18V7m18 11V9a2 2 0 0 0-2-2H3m0 9h18M3 12h18M7 7v5m7-5v5M3 18v3m18-3v3"/>',
  bag: '<path d="M5 7h14l2 14H3L5 7ZM8 8V6a4 4 0 0 1 8 0v2"/>',
  bus: '<rect x="4" y="3" width="16" height="16" rx="4"/><path d="M4 11h16M8 19v2m8-2v2M8 15h.01M16 15h.01M8 3h8"/>',
  chat: '<path d="M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-.8L3 21l1.8-5A9 9 0 1 1 21 11Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
  camera: '<path d="M5 7h3l2-3h4l2 3h3a2 2 0 0 1 2 2v10H3V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/>',
  medical: '<rect x="3" y="6" width="18" height="15" rx="3"/><path d="M8 6V3h8v3m-4 5v6m-3-3h6"/>',
  coffee: '<path d="M4 8h13v9a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Zm13 0h2a3 3 0 1 1 0 6h-2M7 2v2m4-2v2m4-2v2"/>',
  map: '<path d="m3 5 6-3 6 3 6-3v17l-6 3-6-3-6 3V5Zm6-3v17m6-14v17"/>',
  volume: '<path d="m11 4-6 5H2v6h3l6 5V4Zm5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  book: '<path d="M12 5c-3-3-7-3-10-1v16c3-2 7-2 10 1 3-3 7-3 10-1V4c-3-2-7-2-10 1Zm0 0v16"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  headphones: '<path d="M3 14v-2a9 9 0 0 1 18 0v2M3 13h4v8H5a2 2 0 0 1-2-2v-6Zm18 0h-4v8h2a2 2 0 0 0 2-2v-6Z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z"/>',
};
const icon = (name, className = '') => `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
const storageKey = 'ravan-state-v1';
let stored;
try { stored = localStorage.getItem(storageKey); } catch { stored = null; }
let state = restoreState(stored);
let page = 'home';
let group = 'all';
let query = '';
let lesson = null;
let installPrompt;
let toastTimer;
let audioTimer;
let audioToken = 0;
let returnFocus;
const main = document.querySelector('#main');
const dialog = document.querySelector('#lesson-dialog');
const navItems = [ ['home', 'grid', 'یادگیری'], ['favorites', 'heart', 'علاقه‌مندی‌ها'], ['progress', 'chart', 'پیشرفت من'], ['settings', 'settings', 'تنظیمات'] ];
const todayCount = () => state.activity[dateKey()]?.length || 0;
const categoryFor = id => categories.find(category => category.id === id);
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); }
  catch { toast('ذخیره‌سازی دستگاه در دسترس نیست؛ پیشرفت فقط تا بستن برنامه باقی می‌ماند.'); }
}
function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 4200);
}
function renderNavigation() {
  document.querySelector('#navigation').innerHTML = navItems.map(([id, symbol, label]) => `<button class="nav-link ${page === id ? 'active' : ''}" data-action="navigate" data-page="${id}" ${page === id ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${label}</span>${id === 'favorites' && state.favorites.length ? `<small>${n(state.favorites.length)}</small>` : ''}${id === 'home' ? '<span class="nav-dot"></span>' : ''}</button>`).join('');
  document.querySelector('#breadcrumb').textContent = navItems.find(item => item[0] === page)[2];
  document.querySelector('#header-streak').innerHTML = `${icon('flame')}<span>${n(getStreak(state))} روز پیوسته</span>`;
}

const cityIllustration = `<div class="city-art" aria-hidden="true">
  <div class="hello-bubble"><span class="hello-dot"></span><span lang="tr" dir="ltr">Merhaba!</span><small>یعنی سلام!</small></div>
  <svg class="istanbul" viewBox="0 0 380 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M53 207C14 158 44 71 109 45c73-30 171 8 208 74 39 70-11 115-81 122-71 8-151 4-183-34Z" fill="#dce4d7"/>
    <circle cx="275" cy="76" r="31" fill="#e8ad8d"/>
    <path d="M46 91c13-10 29-11 44-4m206 48c13-10 29-9 39 0" stroke="#fffdf5" stroke-width="9" stroke-linecap="round"/>
    <path d="m80 41 7-8m-3 14 10-2M311 181l6-7m-4 14 8-2" stroke="#8c9b7d" stroke-width="2" stroke-linecap="round"/>
    <path d="M49 204h281M65 216h250" stroke="#82947e" stroke-width="2"/>
    <path d="M104 204v-70h144v70" fill="#e6d8bd"/>
    <path d="M117 134c0-34 23-60 59-60s59 26 59 60" fill="#8eaa93"/>
    <path d="M134 134c0-27 17-49 42-49s42 22 42 49" fill="#a4b9a1"/>
    <path d="M176 74V57m-4 1h8" stroke="#536d5b" stroke-width="3"/>
    <path d="M109 140h135v10H109z" fill="#cfbf9e"/>
    <path d="M155 204v-30a21 21 0 0 1 42 0v30" fill="#5a7463"/>
    <path d="M165 204v-29a11 11 0 0 1 22 0v29" fill="#738e76"/>
    <path d="M119 161h14v22h-14zm99 0h14v22h-14z" fill="#9caa91"/>
    <path d="M86 204V99h14v105M252 204V99h14v105" fill="#dbc9a8"/>
    <path d="m83 99 10-45 10 45m146 0 10-45 10 45" fill="#5c7a67"/>
    <path d="M81 112h24v7H81zm166 0h24v7h-24z" fill="#c3ae8b"/>
    <path d="M55 204v-47h26v47m193 0v-47h25v47" fill="#bec6aa"/>
    <path d="M50 157c0-20 35-20 35 0m184 0c0-20 35-20 35 0" fill="#879f83"/>
    <path d="M40 226c35-8 55 8 88 0s54 7 87 0 62 7 111 0m-264 9c35-8 55 8 88 0s54 7 87 0 48 4 69 0" stroke="#93aa9d" stroke-width="2" stroke-linecap="round"/>
    <path d="M302 38c-24-24-67-21-85-6" stroke="#8a9a81" stroke-dasharray="4 5" stroke-linecap="round"/>
    <path d="m308 43-3-16-5 5-8-2 16 13Z" fill="#526d5c"/>
    <path d="m126 52 6-3 6 3m13-9 5-3 5 3" stroke="#6c866e" stroke-width="2" stroke-linecap="round"/>
  </svg><span class="city-caption" lang="tr" dir="ltr">Bir yolculuk, bin hikâye.</span><span class="art-star">✧</span>
</div>`;

function renderHome() {
  const date = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  const completed = todayCount();
  main.innerHTML = `<section class="welcome-row"><div><div class="eyebrow">یادگیریِ کوچک، اتفاق‌های بزرگ</div><h1>سلام، به روان خوش اومدی<span class="heading-star">✳</span></h1><p>امروز یه قدم دیگه به ترکی حرف زدن نزدیک‌تر شو.</p></div><span class="today-date">${icon('clock')}${e(date)}</span></section>
    <section class="intro-grid"><div class="hero"><div class="hero-copy"><span class="hero-tag"><span></span>هم‌سفرِ فارسی‌زبان تو</span><h2>ترکی یاد بگیر،<br><span>زندگی‌اش کن.</span></h2><p>از اولین سلام تا گشت‌وگذار در استانبول؛<br>جمله‌هایی که واقعاً به کارت میان.</p><button class="button primary hero-button" data-action="continue">${state.lastPhrase ? 'ادامه‌ی یادگیری' : 'بریم یاد بگیریم'}${icon('arrow')}</button><div class="hero-facts"><span><strong>${n(categories.length)}</strong> موقعیت واقعی</span><i></i><span><strong>${n(phrases.length)}</strong> جمله کاربردی</span><i></i><span>${icon('volume')} تلفظ ترکی</span></div></div>${cityIllustration}</div>
    <aside class="daily-card"><div class="card-mini-header"><span>${icon('target')}هدف امروز</span><span class="tiny-badge">روزانه ${n(state.goal)} جمله</span></div><div class="goal-ring" style="--progress:${Math.min(100, completed / state.goal * 100)}%"><div><strong>${n(completed)}<small> / ${n(state.goal)}</small></strong><span>جمله تمرین‌شده</span></div></div><h3>${completed >= state.goal ? 'امروز رو عالی ساختی!' : 'پیشرفت، از همین‌جا شروع می‌شه'}</h3><p>${completed >= state.goal ? 'هدفت کامل شد؛ به خودت افتخار کن.' : 'فقط چند دقیقه برای یک قدم تازه.'}</p><button class="button goal-button" data-action="continue">${completed >= state.goal ? 'باز هم تمرین کنیم' : 'شروع تمرین امروز'}${icon('chevron')}</button></aside></section>
    <section class="categories-section" aria-labelledby="categories-title"><div class="section-heading"><div><h2 id="categories-title">امروز کجا ترکی حرف بزنیم؟</h2><p>یک موقعیت انتخاب کن، با ${n(20)} جمله آماده‌اش شو.</p></div><label class="search-box">${icon('search')}<input type="search" id="category-search" placeholder="جست‌وجوی دسته یا جمله…" value="${e(query)}" aria-label="جست‌وجوی دسته یا جمله"><kbd>/</kbd></label></div><div class="filter-row"><div class="filter-chips" aria-label="فیلتر دسته‌ها">${[['all','همه موقعیت‌ها'],['travel','سفر و گردش'],['daily','زندگی روزمره']].map(([id,label]) => `<button data-action="filter" data-group="${id}" class="filter-chip ${group === id ? 'selected' : ''}" aria-pressed="${group === id}">${label}${id === 'all' ? `<span>${n(10)}</span>` : ''}</button>`).join('')}</div><span class="section-count" id="section-count"></span></div><div id="category-results"></div></section>
    <section class="bottom-note"><span class="headphone-icon">${icon('headphones')}</span><div><h3>فقط نخون، گوش کن و تکرار کن.</h3><p>تلفظ ترکی هر جمله رو بشنو؛ با سرعت خودت، با اعتمادبه‌نفس بیشتر.</p></div><button data-action="sample" class="sample-button">یک جمله امتحان کن${icon('arrow')}</button><span class="note-decoration" aria-hidden="true">Aa</span></section>`;
  renderCategoryResults();
}
function renderCategoryResults() {
  const text = normalize(query);
  const matchingPhrases = searchPhrases(query);
  const filtered = categories.filter(category => (group === 'all' || category.group === group) && (!text || normalize(`${category.title} ${category.turkish} ${category.subtitle}`).includes(text) || matchingPhrases.some(phrase => phrase.categoryId === category.id)));
  document.querySelector('#section-count').textContent = `${n(filtered.length)} دسته برای کشف کردن`;
  document.querySelector('#category-results').innerHTML = filtered.length ? `<div class="category-grid">${filtered.map(category => {
    const count = state.learned.filter(id => id.startsWith(`${category.id}-`)).length;
    return `<button class="category-card ${category.color}" data-action="open-category" data-id="${category.id}"><div class="category-card-top"><span class="category-icon">${icon(category.icon)}</span><span class="category-arrow">${icon('chevron')}</span></div><h3>${category.title}</h3><span class="category-turkish" lang="tr" dir="ltr">${category.turkish}</span><div class="category-meta"><span>${n(20)} جمله</span><span>${count ? `${n(count)} یادگرفته` : 'آماده‌ی شروع'}</span></div><span class="category-progress"><span style="width:${count * 5}%"></span></span></button>`;
  }).join('')}</div>${text ? renderSearchMatches(matchingPhrases.filter(phrase => group === 'all' || categoryFor(phrase.categoryId).group === group)) : ''}` : emptyState('search', 'چیزی پیدا نشد', 'یک کلمه دیگر، به فارسی یا ترکی جست‌وجو کن.');
}
function renderSearchMatches(list) {
  if (!list.length) return '';
  return `<div class="search-matches"><h3>جمله‌های مرتبط <span>${n(list.length)}</span></h3>${list.slice(0, 12).map(phrase => phraseRow(phrase)).join('')}${list.length > 12 ? '<p class="muted">برای دیدن جمله‌های بیشتر، جست‌وجو را دقیق‌تر کن یا دسته را باز کن.</p>' : ''}</div>`;
}
function emptyState(symbol, title, description, action = '') {
  return `<div class="empty-state"><span>${icon(symbol)}</span><h2>${title}</h2><p>${description}</p>${action}</div>`;
}
function phraseRow(phrase) {
  const category = categoryFor(phrase.categoryId);
  return `<article class="phrase-row"><span class="row-category-icon ${category.color}">${icon(category.icon)}</span><button class="phrase-open" data-action="open-phrase" data-id="${phrase.id}"><strong lang="tr" dir="ltr">${e(phrase.tr)}</strong><span>${e(phrase.fa)}</span></button><button class="icon-button" data-action="play-phrase" data-id="${phrase.id}" aria-label="پخش تلفظ ترکی">${icon('volume')}</button><button class="icon-button ${state.favorites.includes(phrase.id) ? 'is-favorite' : ''}" data-action="favorite" data-id="${phrase.id}" aria-label="${state.favorites.includes(phrase.id) ? 'حذف از' : 'افزودن به'} علاقه‌مندی‌ها" aria-pressed="${state.favorites.includes(phrase.id)}">${icon('heart')}</button></article>`;
}
function renderFavorites() {
  const saved = phrases.filter(phrase => state.favorites.includes(phrase.id));
  main.innerHTML = `<section class="page-title"><div class="eyebrow">جمله‌های دوست‌داشتنی تو</div><h1>یک گوشه برای علاقه‌مندی‌ها</h1><p>جمله‌هایی که می‌خوای همیشه دم دستت باشن.</p></section>${saved.length ? `<div class="saved-header"><span>${n(saved.length)} جمله ذخیره‌شده</span><button class="button primary" data-action="review-favorites">مرور فلش‌کارت‌ها${icon('arrow')}</button></div><div class="phrase-list">${saved.map(phraseRow).join('')}</div>` : emptyState('heart','هنوز جمله‌ای ذخیره نکردی','روی قلب هر فلش‌کارت بزن تا اینجا پیداش کنی.', '<button class="button primary" data-action="navigate" data-page="home">کشف جمله‌ها'+icon('arrow')+'</button>')}`;
}
function renderProgress() {
  const recent = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - 6 + index); return { day: new Intl.DateTimeFormat('fa-IR', { weekday: 'short' }).format(date), count: state.activity[dateKey(date)]?.length || 0, today: index === 6 }; });
  const maximum = Math.max(state.goal, ...recent.map(day => day.count));
  main.innerHTML = `<section class="page-title"><div class="eyebrow">هر قدم کوچک، ارزشمنده</div><h1>ببین چقدر جلو اومدی</h1><p>این مسیر توئه؛ با سرعت خودت ادامه‌اش بده.</p></section><div class="stats-grid">${[[icon('book'),n(state.learned.length),'جمله یادگرفته'],[icon('flame'),n(getStreak(state)),'روز یادگیری پیوسته'],[icon('target'),n(todayCount()),'جمله تمرین‌شده امروز']].map(([symbol,value,label]) => `<div class="stat-card"><span>${symbol}</span><strong>${value}</strong><small>${label}</small></div>`).join('')}</div><section class="progress-panel"><div class="section-heading"><div><h2>هفت روز، هفت فرصت تازه</h2><p>هر ستون، تعداد جمله‌های متفاوتی است که آن روز تمرین کردی.</p></div><span class="tiny-badge">هدف روزانه: ${n(state.goal)}</span></div><div class="weekly-chart">${recent.map(day => `<div class="chart-column ${day.today ? 'is-today' : ''}"><strong>${n(day.count)}</strong><div class="bar-track"><div style="height:${day.count / maximum * 100}%"></div></div><span>${day.day}</span></div>`).join('')}</div></section><section class="progress-panel"><h2>مسیرت در هر موقعیت</h2><div class="category-progress-list">${categories.map(category => { const count = state.learned.filter(id => id.startsWith(`${category.id}-`)).length; return `<button class="progress-category" data-action="open-category" data-id="${category.id}"><span class="row-category-icon ${category.color}">${icon(category.icon)}</span><div><strong>${category.title}</strong><span class="progress-track"><span style="width:${count * 5}%"></span></span></div><small>${n(count)} از ${n(20)}</small>${icon('chevron')}</button>`; }).join('')}</div></section>`;
}
function renderSettings() {
  const native = Boolean(window.AndroidSpeech);
  const voice = !native && 'speechSynthesis' in window ? speechSynthesis.getVoices().find(voice => voice.lang.toLowerCase().startsWith('tr')) : null;
  main.innerHTML = `<section class="page-title"><div class="eyebrow">روان، به سبک خودت</div><h1>یه یادگیری شخصی‌تر</h1><p>قدم‌های کوچکت رو اندازه بگیر، نه سرعت بقیه رو.</p></section><div class="settings-grid"><section class="settings-card"><span class="settings-symbol">${icon('target')}</span><h2>هدف روزانه</h2><p>روزانه چند جمله با هم تمرین کنیم؟</p><div class="option-group">${[5,10,20].map(goal => `<button class="option ${state.goal === goal ? 'selected' : ''}" data-action="goal" data-value="${goal}" aria-pressed="${state.goal === goal}">${n(goal)} جمله<small>${goal === 5 ? 'یک شروع آروم' : goal === 10 ? 'قدم‌های پیوسته' : 'با انرژی بیشتر'}</small></button>`).join('')}</div></section><section class="settings-card"><span class="settings-symbol">${icon('volume')}</span><h2>سرعت تلفظ</h2><p>گوش کن، تکرار کن و راحت‌تر حرف بزن.</p><div class="option-group">${[[0.65,'آهسته'],[0.85,'آموزشی'],[1,'طبیعی']].map(([rate,label]) => `<button class="option ${state.rate === rate ? 'selected' : ''}" data-action="rate" data-value="${rate}" aria-pressed="${state.rate === rate}">${label}</button>`).join('')}</div><button class="text-button" data-action="test-audio">${icon('volume')}تست تلفظ ترکی</button></section><section class="settings-card wide"><span class="settings-symbol">${icon('headphones')}</span><h2>درباره تلفظ ترکی</h2><p>${native ? 'تلفظ با موتور گفتار اندروید پخش می‌شود. برای استفاده آفلاین، داده صوتی ترکی را در تنظیمات تبدیل متن به گفتار دستگاه نصب کن.' : voice ? 'صدای ترکی دستگاه شناسایی شد. تلفظ با موتور گفتار دستگاه پخش می‌شود؛ بعضی صداها به اینترنت نیاز دارند.' : 'برای پخش تلفظ، یک صدای ترکی (Türkçe) در تنظیمات تبدیل متن به گفتار دستگاه نصب کن. پشتیبانی صوتی به مرورگر و دستگاه وابسته است.'}</p><small class="muted">جمله‌ها و ترجمه‌ها آفلاین هستند؛ صدا فایل ضبط‌شده نیست و با گفتار دستگاه تولید می‌شود.</small></section><section class="settings-card"><span class="settings-symbol">${icon('download')}</span><h2>همراه همیشگی تو</h2><p>روان را روی صفحه اصلی دستگاهت داشته باش.</p><button class="button outlined" data-action="install">افزودن به صفحه اصلی${icon('download')}</button></section><section class="settings-card"><span class="settings-symbol danger">${icon('trash')}</span><h2>اطلاعات یادگیری</h2><p>پیشرفت و علاقه‌مندی‌ها فقط روی همین دستگاه ذخیره می‌شوند.</p><button class="text-button danger" data-action="reset">پاک‌کردن پیشرفت و علاقه‌مندی‌ها</button></section></div>`;
}
function render() {
  renderNavigation();
  ({ home: renderHome, favorites: renderFavorites, progress: renderProgress, settings: renderSettings })[page]();
}
function navigate(nextPage) {
  if (!navItems.some(item => item[0] === nextPage)) return;
  stopAudio();
  page = nextPage;
  query = '';
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function openLesson(list, start = 0, title) {
  if (!list.length) return;
  returnFocus = document.activeElement;
  lesson = { list, index: Math.max(0, Math.min(start, list.length - 1)), title };
  renderLesson();
  dialog.showModal();
}
function openCategory(id) {
  const category = categoryFor(id);
  if (!category) return;
  const list = phrases.filter(phrase => phrase.categoryId === id);
  const next = list.findIndex(phrase => !state.learned.includes(phrase.id));
  openLesson(list, next < 0 ? 0 : next, category.title);
}
function continueLesson() {
  if (state.lastPhrase) {
    const last = phrases.find(phrase => phrase.id === state.lastPhrase);
    const list = phrases.filter(phrase => phrase.categoryId === last.categoryId);
    const next = list.findIndex(phrase => !state.learned.includes(phrase.id));
    openLesson(list, next < 0 ? 0 : next, categoryFor(last.categoryId).title);
  } else openCategory('greetings');
}
function renderLesson() {
  const phrase = lesson.list[lesson.index];
  const category = categoryFor(phrase.categoryId);
  const favorite = state.favorites.includes(phrase.id);
  const learned = state.learned.includes(phrase.id);
  const completed = lesson.list.filter(item => state.learned.includes(item.id)).length;
  const allDone = completed === lesson.list.length;
  state.lastPhrase = phrase.id;
  persist();
  document.querySelector('#lesson-content').innerHTML = `<header class="lesson-header"><div><span class="row-category-icon ${category.color}">${icon(category.icon)}</span><div><small>با هر جمله، آماده‌تر</small><h2 id="lesson-title">${e(lesson.title || category.title)}</h2></div></div><button class="icon-button close-dialog" data-action="close-lesson" aria-label="بستن فلش‌کارت">${icon('close')}</button></header><div class="lesson-position"><span>فلش‌کارت ${n(lesson.index + 1)} از ${n(lesson.list.length)}</span><span>${n(completed)} جمله یادگرفته</span></div><div class="lesson-progress"><span style="width:${(lesson.index + 1) / lesson.list.length * 100}%"></span></div><div class="flashcard"><div class="flashcard-top"><span class="language-label"><span class="turkish-dot"></span>ترکی استانبولی<span lang="tr">Türkçe</span></span><button class="icon-button favorite-button ${favorite ? 'is-favorite' : ''}" data-action="favorite" data-id="${phrase.id}" aria-label="${favorite ? 'حذف از' : 'افزودن به'} علاقه‌مندی‌ها" aria-pressed="${favorite}">${icon('heart')}</button></div><p class="turkish-phrase" dir="ltr" lang="tr">${e(phrase.tr)}</p><div class="translation-divider"><span>معنی فارسی</span></div><p class="persian-phrase">${e(phrase.fa)}</p><div class="audio-controls"><button class="button audio-button" data-action="play" id="play-audio">${icon('volume')}<span class="audio-state">گوش کن و تکرار کن</span><span class="audio-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button><button class="slow-button" data-action="play-slow" aria-label="پخش آهسته تلفظ">آهسته‌تر<span dir="ltr">0.65×</span></button></div><p class="audio-hint" id="audio-hint" role="status">تلفظ ترکی با صدای دستگاه</p>${learned ? `<span class="learned-badge">${icon('check')}این جمله رو یاد گرفتی</span>` : ''}</div><div class="lesson-actions"><button class="button outlined previous-button" data-action="previous" ${lesson.index === 0 ? 'disabled' : ''}>${icon('chevron')}قبلی</button><button class="button primary learned-button" data-action="learn">${icon(learned ? 'check' : 'spark')}${learned ? 'دوباره تمرین کردم' : 'یاد گرفتم'}</button><button class="button outlined" data-action="next" ${lesson.index === lesson.list.length - 1 ? 'disabled' : ''}>بعدی${icon('chevron')}</button></div>${allDone ? `<div class="lesson-complete">${icon('spark')}همه جمله‌های این مجموعه رو تمرین کردی. آفرین!<button class="text-button" data-action="close-lesson">بازگشت به دسته‌ها${icon('arrow')}</button></div>` : '<p class="keyboard-hint">برای جابه‌جایی از کلیدهای جهت‌دار و برای شنیدن از Space استفاده کن.</p>'}`;
}
function moveLesson(delta) {
  if (!lesson) return;
  const next = lesson.index + delta;
  if (next < 0 || next >= lesson.list.length) return;
  stopAudio();
  lesson.index = next;
  renderLesson();
}
function closeLesson() {
  stopAudio();
  dialog.close();
  lesson = null;
  render();
  if (returnFocus?.isConnected) returnFocus.focus();
  else document.querySelector('.nav-link.active')?.focus();
}
function setAudioStatus(message, playing = false) {
  document.querySelector('#play-audio')?.classList.toggle('playing', playing);
  const label = document.querySelector('.audio-state');
  if (label) label.textContent = playing ? 'در حال پخش…' : 'گوش کن و تکرار کن';
  const hint = document.querySelector('#audio-hint');
  if (hint) hint.textContent = message;
}
function stopAudio() {
  audioToken++;
  clearTimeout(audioTimer);
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (window.AndroidSpeech) window.AndroidSpeech.stop();
  setAudioStatus('تلفظ ترکی با صدای دستگاه');
}
function audioUnavailable(message) {
  setAudioStatus(message);
  toast(message);
}
function playPhrase(phrase, slow = false) {
  stopAudio();
  const token = audioToken;
  const rate = slow ? 0.65 : state.rate;
  if (window.AndroidSpeech) {
    if (!window.AndroidSpeech.speak(phrase.tr, rate, String(token))) audioUnavailable('صدای ترکی آماده نیست. زبان ترکی را در تنظیمات گفتار اندروید نصب کن.');
    return;
  }
  if (!('speechSynthesis' in window)) {
    audioUnavailable('این مرورگر از تلفظ پشتیبانی نمی‌کند؛ از نسخه اندروید یا مرورگر سازگار استفاده کن.');
    return;
  }
  const voices = speechSynthesis.getVoices();
  const voice = voices.find(voice => voice.lang.toLowerCase() === 'tr-tr') || voices.find(voice => voice.lang.toLowerCase().startsWith('tr'));
  if (!voice) {
    audioUnavailable('صدای ترکی پیدا نشد؛ زبان Türkçe را در تنظیمات گفتار دستگاه نصب کن.');
    return;
  }
  const utterance = new SpeechSynthesisUtterance(phrase.tr);
  utterance.lang = 'tr-TR';
  utterance.voice = voice;
  utterance.rate = rate;
  utterance.onstart = () => { if (token === audioToken) { clearTimeout(audioTimer); setAudioStatus(slow ? 'تلفظ آهسته ترکی' : 'با دقت گوش کن و تکرار کن', true); } };
  utterance.onend = () => { if (token === audioToken) setAudioStatus('حالا نوبت توئه؛ با صدای بلند تکرار کن.'); };
  utterance.onerror = event => { if (token === audioToken && !['canceled','interrupted'].includes(event.error)) audioUnavailable('پخش صدا ممکن نشد؛ اتصال یا تنظیمات صدای دستگاه را بررسی کن.'); };
  setAudioStatus('در حال آماده‌سازی صدا…', true);
  audioTimer = setTimeout(() => { if (token === audioToken) { speechSynthesis.cancel(); audioUnavailable('پخش صدا شروع نشد؛ تنظیمات صدای دستگاه را بررسی کن.'); } }, 10000);
  speechSynthesis.speak(utterance);
}
window.onNativeSpeechStatus = (status, utteranceId) => {
  if (utteranceId !== String(audioToken)) return;
  if (status === 'start') setAudioStatus('با دقت گوش کن و تکرار کن', true);
  if (status === 'done') setAudioStatus('حالا نوبت توئه؛ با صدای بلند تکرار کن.');
  if (status === 'error') audioUnavailable('پخش صدای ترکی ممکن نشد؛ تنظیمات گفتار دستگاه را بررسی کن.');
};
window.closeRavanLesson = () => {
  if (!dialog.open) return false;
  closeLesson();
  return true;
};

document.addEventListener('click', async event => {
  const target = event.target.closest('[data-action]');
  if (!target || target.disabled) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (action === 'navigate') navigate(target.dataset.page);
  if (action === 'filter') { group = target.dataset.group; renderHome(); }
  if (action === 'open-category') openCategory(id);
  if (action === 'continue') continueLesson();
  if (action === 'sample') openLesson(phrases.filter(phrase => phrase.categoryId === 'restaurant'), 1, 'یک طعم از ترکی');
  if (action === 'open-phrase') { const phrase = phrases.find(phrase => phrase.id === id); if (phrase) { const list = phrases.filter(item => item.categoryId === phrase.categoryId); openLesson(list, list.findIndex(item => item.id === id)); } }
  if (action === 'review-favorites') openLesson(phrases.filter(phrase => state.favorites.includes(phrase.id)), 0, 'مرور علاقه‌مندی‌ها');
  if (action === 'close-lesson') closeLesson();
  if (action === 'previous') moveLesson(-1);
  if (action === 'next') moveLesson(1);
  if (action === 'play' || action === 'play-slow') playPhrase(lesson.list[lesson.index], action === 'play-slow');
  if (action === 'play-phrase') { const phrase = phrases.find(item => item.id === id); if (phrase) playPhrase(phrase); }
  if (action === 'test-audio') playPhrase(phrases.find(phrase => phrase.id === 'greetings-1'));
  if (action === 'favorite') {
    toggleFavorite(state, id); persist(); renderNavigation();
    const selected = state.favorites.includes(id);
    target.classList.toggle('is-favorite', selected);
    target.setAttribute('aria-pressed', String(selected));
    target.setAttribute('aria-label', `${selected ? 'حذف از' : 'افزودن به'} علاقه‌مندی‌ها`);
    if (page === 'favorites' && !dialog.open) renderFavorites();
    toast(selected ? 'به علاقه‌مندی‌هات اضافه شد.' : 'از علاقه‌مندی‌ها حذف شد.');
  }
  if (action === 'learn') {
    stopAudio();
    markLearned(state, lesson.list[lesson.index].id); persist(); renderNavigation();
    if (lesson.index < lesson.list.length - 1) { lesson.index++; renderLesson(); toast('یک قدم جلوتر؛ آفرین!'); }
    else { renderLesson(); toast(lesson.list.every(phrase => state.learned.includes(phrase.id)) ? 'همه جمله‌های مجموعه را تمرین کردی. عالی بود!' : 'آفرین! می‌تونی جمله‌های قبلی رو هم مرور کنی.'); }
  }
  if (action === 'goal') { state.goal = Number(target.dataset.value); persist(); renderSettings(); toast('هدف روزانه‌ات ذخیره شد.'); }
  if (action === 'rate') { state.rate = Number(target.dataset.value); persist(); renderSettings(); }
  if (action === 'reset' && window.confirm('همه پیشرفت و علاقه‌مندی‌ها پاک می‌شوند. مطمئنی؟')) { state = restoreState(null); persist(); render(); toast('اطلاعات یادگیری پاک شد؛ آماده یک شروع تازه‌ای.'); }
  if (action === 'install') {
    if (window.AndroidSpeech || window.matchMedia('(display-mode: standalone)').matches) { toast('روان همین حالا به‌صورت اپ روی دستگاهت باز است.'); return; }
    if (installPrompt) { await installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; }
    else toast('از منوی مرورگر، «نصب برنامه» یا «افزودن به صفحه اصلی» را انتخاب کن.');
  }
});
document.addEventListener('input', event => { if (event.target.id === 'category-search') { query = event.target.value; renderCategoryResults(); } });
dialog.addEventListener('cancel', event => { event.preventDefault(); closeLesson(); });
dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeLesson(); } });
document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); navigate('home'); });
document.addEventListener('keydown', event => {
  if (['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
  if (!dialog.open) { if (event.key === '/' && page === 'home') { event.preventDefault(); document.querySelector('#category-search')?.focus(); } return; }
  if (event.key === 'ArrowLeft') { event.preventDefault(); moveLesson(1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); moveLesson(-1); }
  if (event.code === 'Space' && document.activeElement.tagName !== 'BUTTON') { event.preventDefault(); playPhrase(lesson.list[lesson.index]); }
});
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
window.addEventListener('pagehide', stopAudio);
if ('speechSynthesis' in window) speechSynthesis.getVoices();
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !window.AndroidSpeech) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
render();
