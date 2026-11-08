const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const demoStocks = [
  { symbol: 'INFY', name: 'Infosys Limited', initials: 'IN', price: '₹1,847.20', change: '+1.84%', positive: true, prediction: 'Positive', confidence: 78, delta: .012, sentiment: 'Positive', gtt: false },
  { symbol: 'RELIANCE', name: 'Reliance Industries', initials: 'RE', price: '₹2,934.15', change: '+0.82%', positive: true, prediction: 'Positive', confidence: 67, delta: .005, sentiment: 'Positive', gtt: false },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', initials: 'HD', price: '₹1,682.40', change: '−0.37%', positive: false, prediction: 'Neutral', confidence: 54, delta: -.002, sentiment: 'Neutral', gtt: false }
];

let stocks = [];
try {
  const savedText = localStorage.getItem('marketpilot-stocks');
  const saved = savedText ? JSON.parse(savedText) : [];
  const hasSeeded = localStorage.getItem('marketpilot-demo-seeded-v2');
  stocks = Array.isArray(saved) ? saved : [];
  if (!hasSeeded && stocks.length === 0) {
    stocks = demoStocks.map(stock => ({ ...stock }));
  }
  localStorage.setItem('marketpilot-demo-seeded-v2', 'true');
  if (stocks.length) {
    localStorage.setItem('marketpilot-stocks', JSON.stringify(stocks));
  }
} catch {
  stocks = demoStocks.map(stock => ({ ...stock }));
}

const articleData = {
  INFY: [
    ['Infosys gains as analysts raise outlook following strong quarterly momentum', 'Economic Times', '18 min ago', 'positive'],
    ['Trading volume rises above its 20-day average in morning session', 'Moneycontrol', '34 min ago', 'positive'],
    ['Brokerages revise INFY price targets ahead of results', 'Reuters', '2 hrs ago', 'watch']
  ],
  RELIANCE: [
    ['Reliance outlines next phase of retail and digital expansion', 'Business Standard', '52 min ago', 'watch'],
    ['Institutional investors adjust Reliance positions, exchange data shows', 'Bloomberg', '4 hrs ago', 'neutral']
  ],
  HDFCBANK: [
    ['HDFC Bank deposit growth and margins in focus ahead of results', 'Mint', '1 hr ago', 'neutral'],
    ['Analysts watch loan growth trends across private lenders', 'Financial Express', '3 hrs ago', 'watch']
  ],
  TCS: [
    ['TCS expands institutional partnership to strengthen domestic reach', 'Financial Express', '3 hrs ago', 'positive'],
    ['What steady deal wins could mean for TCS in the coming quarter', 'The Hindu BusinessLine', 'Yesterday', 'watch']
  ]
};

const summaryData = {
  INFY: 'Coverage is constructive after a strong quarter, with analysts raising outlooks and trading activity picking up.',
  RELIANCE: 'Recent coverage centers on Reliance’s retail and digital expansion. The outlook is mixed while investors wait for more detail.',
  HDFCBANK: 'Coverage is focused on deposit growth and margins ahead of results. Current article sentiment is measured, with no strong directional consensus.',
  TCS: 'Recent stories highlight partnership activity and steady deal wins, supporting a constructive tone around the company.'
};

function safeGet(key, fallback = '') {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

function saveStocks() {
  safeSet('marketpilot-stocks', JSON.stringify(stocks));
}

function numericPrice(value) {
  return Number(String(value || '').replace(/[^\d.]/g, '')) || 0;
}

function money(value) {
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function displayDate() {
  const el = $('#todayDate');
  if (el) {
    el.textContent = new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date()).toUpperCase();
  }
}

function setTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  const glyph = $('#themeGlyph');
  if (glyph) glyph.textContent = dark ? '☀' : '☾';
  const toggle = $('#themeToggle');
  if (toggle) toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  const meta = $('meta[name="theme-color"]');
  if (meta) meta.content = dark ? '#000000' : '#f5f4ef';
}

const preferredTheme = safeGet('marketpilot-theme');
if (preferredTheme) document.documentElement.dataset.theme = preferredTheme;
setTheme();

function showToast(title, message) {
  const toast = $('#toast');
  if (!toast) return;
  $('#toastTitle').textContent = title;
  $('#toastText').textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 3600);
}

function logActivity(title, detail) {
  const panel = $('#activityPanel');
  if (!panel) return;
  $('#activityEmpty')?.remove();
  const row = document.createElement('div');
  row.className = 'activity-row';
  row.innerHTML = '<span class="activity-icon sync">✳</span><div class="activity-main"><strong></strong><span></span></div><span class="activity-time">Just now</span><span class="status-pill">Updated</span>';
  $('.activity-main strong', row).textContent = title;
  $('.activity-main span', row).textContent = detail;
  panel.prepend(row);
}

function modelPrice(stock) {
  const price = numericPrice(stock.price);
  return Math.round(price * (1 + (Number(stock.delta) || .005)) * 100) / 100;
}

function predictionHTML(stock) {
  return `<div class="prediction-cell"><button class="predict-button" data-predict="${stock.symbol}">${stock.predictedPrice ? 'Refresh' : 'Predict'}</button><div class="prediction-result" ${stock.predictedPrice ? '' : 'hidden'}><strong>${stock.predictedPrice ? money(stock.predictedPrice) : ''}</strong><small>estimated next-day · ${stock.confidence || 60}%</small></div></div>`;
}

function rowHTML(stock, full) {
  const quote = `<div class="stock-quote"><strong>${stock.price && stock.price !== '—' ? money(numericPrice(stock.price)) : '—'}</strong><small class="${stock.positive ? 'positive' : 'negative'}">${stock.change || '—'}</small></div>`;
  return `<div class="${full ? 'full-stock-row' : 'stock-row'}" data-symbol="${stock.symbol}"><div class="stock-name"><span class="stock-monogram">${stock.initials}</span><span><strong>${stock.symbol}</strong><small>${stock.name}</small></span></div>${quote}${full ? `<div class="stock-quote"><strong class="${stock.positive ? 'positive' : 'negative'}">${stock.change || '—'}</strong><small>today</small></div>` : ''}${predictionHTML(stock)}${full ? `<div class="gtt-control"><label class="stock-switch-wrap table-toggle" title="Toggle GTT"><span>GTT</span><input type="checkbox" class="switch gtt-switch" ${stock.gtt ? 'checked' : ''} aria-label="GTT alert for ${stock.symbol}"></label>${stock.gtt ? `<small class="gtt-summary">${stock.side === 'SELL' ? 'Sell above' : 'Buy below'} ${money(stock.trigger)} · ${stock.quantity} qty</small>` : ''}</div><div class="row-actions"><button class="setup-button" data-setup="${stock.symbol}">${stock.gtt ? 'Edit' : 'Set up'}</button><button class="remove-button" data-remove="${stock.symbol}" aria-label="Remove ${stock.symbol}">Remove</button></div>` : ''}</div>`;
}

function renderStocks() {
  const overview = $('#overviewStocks'), table = $('#watchRows');
  if (overview) overview.innerHTML = stocks.length ? stocks.map(s => rowHTML(s, false)).join('') : '<div class="empty-state">Your watchlist is empty. Add a company to see it here.</div>';
  if (table) table.innerHTML = stocks.length ? stocks.map(s => rowHTML(s, true)).join('') : '<div class="empty-state">No companies yet. Add your first stock to get started.</div>';
  $$('.nav-count').forEach(el => el.textContent = String(stocks.length).padStart(2, '0'));
  const count = $('#dashboardStockCount'); if (count) count.textContent = stocks.length;
  const value = $('#watchlistValue'); if (value) value.textContent = money(stocks.reduce((sum, s) => sum + numericPrice(s.price), 0));
  const positive = stocks.filter(s => s.prediction === 'Positive');
  const positiveCount = $('#positiveSetupCount'); if (positiveCount) positiveCount.textContent = positive.length;
  const leader = [...positive].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
  const top = $('#topPrediction'); if (top) top.textContent = leader ? `${leader.symbol} · ${leader.confidence}% confidence` : 'Add a stock to see predictions';
  const focus = [...stocks].sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
  const label = $('#insightLabel'), title = $('#insightTitle'), text = $('#insightText'), button = $('#insightButton');
  if (label) label.textContent = focus ? `MODEL OUTLOOK · ${focus.symbol}` : 'MODEL OUTLOOK';
  if (title) title.textContent = focus ? `${focus.name} is on your radar` : 'Your watchlist is ready';
  if (text) text.textContent = focus ? `${focus.prediction || 'Neutral'} next-day setup · ${focus.confidence || 60}% model confidence. Open its individual story summary for more context.` : 'Add a company to see its model outlook and market context here.';
  if (button) {
    button.hidden = !focus;
    if (focus) button.href = `market-stories.html#${encodeURIComponent(focus.symbol)}`;
  }
  saveStocks();
}

function renderNews() {
  const container = $('#individualNews');
  if (!container) return;
  container.innerHTML = stocks.length ? stocks.map(stock => {
    const stories = articleData[stock.symbol] || [];
    return `<article class="panel company-news-card" id="${stock.symbol}"><div class="company-news-head"><span class="stock-monogram">${stock.initials}</span><div><strong>${stock.name}</strong><small>${stock.symbol} · Sentiment: <b class="${stock.sentiment === 'Positive' ? 'positive' : 'neutral-text'}">${stock.sentiment || 'Neutral'}</b></small></div><button class="button button-soft summarize-stock" data-summarize="${stock.symbol}">✦ &nbsp;Summarize ${stock.symbol}</button></div>${stories.length ? `<div class="company-articles">${stories.map(story => `<article class="company-article"><span class="article-tone ${story[3]}">${story[3] === 'positive' ? 'Positive' : story[3] === 'watch' ? 'Watch' : 'Neutral'}</span><strong>${story[0]}</strong><span>${story[1]} · ${story[2]}</span></article>`).join('')}</div>` : '<div class="empty-state">No demo stories are available for this stock yet.</div>'}</article>`;
  }).join('') : '<div class="empty-state">Your Market Stories will appear here for each stock you add.</div>';
}

function openSummary(symbol) {
  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) return;
  const dialog = $('#summaryModal');
  if (!dialog) return;
  const heading = $('#summaryTitle');
  if (heading) heading.textContent = `${stock.symbol} · ${stock.name}`;
  const content = $('#summaryContent');
  if (content) {
    const count = (articleData[stock.symbol] || []).length;
    content.innerHTML = `<article><div class="summary-heading"><strong>News summary</strong><span class="sentiment ${stock.sentiment === 'Positive' ? 'positive' : ''}">${stock.sentiment || 'Neutral'}</span></div><p>${summaryData[stock.symbol] || `There are no demo news articles to summarize for ${stock.symbol} yet.`}</p><small class="summary-story-count">Based on ${count} individual ${count === 1 ? 'story' : 'stories'} from this company’s section.</small></article><article><div class="summary-heading"><strong>Model outlook</strong><span class="sentiment">${stock.prediction || 'Neutral'} · ${stock.confidence || 60}%</span></div><p>${stock.predictedPrice ? `Estimated next-day price: ${money(stock.predictedPrice)}.` : 'Use Predict in the watchlist to reveal a price estimate.'} Model outputs are estimates, not guarantees.</p></article>`;
  }
  dialog.showModal();
}

function openGtt(stock) {
  const dialog = $('#gttModal');
  if (!dialog) return;
  window.pendingGttSymbol = stock.symbol;
  $('#gttCompanyCopy').textContent = `Set trigger, limit, and quantity for ${stock.symbol}. You choose the actual order prices.`;
  $('#gttSide').value = stock.side || 'BUY';
  $('#gttQuantity').value = stock.quantity || 1;
  const estimate = stock.predictedPrice || modelPrice(stock);
  $('#gttSuggested').textContent = numericPrice(stock.price) ? `Model estimate: ${money(estimate)} · edit either price as needed` : 'Add a current price to calculate a model reference.';
  $('#gttTrigger').value = stock.trigger || (numericPrice(stock.price) ? estimate.toFixed(2) : '');
  $('#gttLimit').value = stock.limit || (numericPrice(stock.price) ? estimate.toFixed(2) : '');
  dialog.showModal();
}

function initOverview() {
  displayDate();
  const panel = $('#activityPanel');
  if (panel && !stocks.length) $('#activityEmpty').textContent = 'Your activity will appear here after you add a stock or set up an alert.';
}

function initWatchlist() {
  $('#stockSearch')?.addEventListener('input', e => {
    $$('.full-stock-row').forEach(row => row.hidden = !row.textContent.toLowerCase().includes(e.target.value.toLowerCase()));
  });
  $('#addStockButton')?.addEventListener('click', () => $('#addModal').showModal());
  $('#addForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const symbol = $('#newSymbol').value.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, '');
    const price = Number($('#newPrice').value) || 0;
    if (!symbol) return;
    if (stocks.some(s => s.symbol === symbol)) {
      showToast('Already on your watchlist', `${symbol} is already tracked.`);
      $('#addModal').close();
      return;
    }
    stocks.push({
      symbol,
      name: `${symbol} Limited`,
      initials: symbol.slice(0, 2),
      price: price ? money(price) : '—',
      change: '—',
      positive: true,
      prediction: 'Neutral',
      confidence: 60,
      delta: .005,
      sentiment: 'Neutral',
      gtt: false
    });
    renderStocks();
    $('#addModal').close();
    $('#newSymbol').value = '';
    $('#newPrice').value = '';
    logActivity('Stock added', `${symbol} was added to your watchlist.`);
    showToast('Added to your watchlist', `${symbol} now appears across your workspace.`);
  });
}

function initNews() {
  renderNews();
}

function initProfile() {
  try {
    const profile = JSON.parse(safeGet('marketpilot-profile', '{}'));
    if ($('#profileName') && profile.name) $('#profileName').value = profile.name;
    if ($('#profileEmail') && profile.email) $('#profileEmail').value = profile.email;
    if ($('#profilePhone') && profile.phone) $('#profilePhone').value = profile.phone;
    if (profile.name) {
      const heading = $('#profileHeading');
      if (heading) heading.textContent = profile.name;
      const avatar = $('#profileAvatar');
      if (avatar) avatar.textContent = profile.name.split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
      $$('.user-info strong').forEach(el => el.textContent = profile.name);
    }
  } catch {}

  $('#saveProfile')?.addEventListener('click', () => {
    const profile = {
      name: $('#profileName').value.trim(),
      email: $('#profileEmail').value.trim(),
      phone: $('#profilePhone').value.trim()
    };
    safeSet('marketpilot-profile', JSON.stringify(profile));
    $('#profileHeading').textContent = profile.name || 'Your profile';
    $('#profileAvatar').textContent = (profile.name || 'AK').split(/\s+/).map(x => x[0]).join('').slice(0, 2).toUpperCase();
    $$('.user-info strong').forEach(el => el.textContent = profile.name || 'Your profile');
    $('#profileFeedback').textContent = 'Saved';
    showToast('Profile saved', 'Your details have been updated in this browser.');
  });
}

function initPricing() {
  const selected = safeGet('marketpilot-plan', 'Nidhi');
  $$('[data-plan]').forEach(button => {
    if (button.dataset.plan === selected) {
      button.textContent = `Selected: ${selected}`;
      button.classList.add('selected-plan');
    }
  });
  $$('[data-plan]').forEach(button => button.addEventListener('click', () => {
    safeSet('marketpilot-plan', button.dataset.plan);
    $$('[data-plan]').forEach(item => {
      item.classList.remove('selected-plan');
      item.textContent = `Choose ${item.dataset.plan}`;
    });
    button.textContent = `Selected: ${button.dataset.plan}`;
    button.classList.add('selected-plan');
    showToast(`${button.dataset.plan} selected`, 'Demo plan selection saved in this browser. Billing is not connected.');
  }));
}

function initAuth() {
  const tabs = $$('.auth-tabs [data-auth-mode]');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    const signup = tab.dataset.authMode === 'signup';
    tabs.forEach(t => t.classList.toggle('selected', t === tab));
    $('#loginForm').hidden = signup;
    $('#signupForm').hidden = !signup;
    $('#authTitle').textContent = signup ? 'Create your account' : 'Welcome back';
    $('#authSubtitle').textContent = signup ? 'Start with a personal MarketPilot workspace.' : 'Sign in to your MarketPilot workspace.';
  }));
}

document.addEventListener('click', e => {
  const close = e.target.closest('[data-close]');
  if (close) {
    $(`#${close.dataset.close}`)?.close();
    return;
  }
  const remove = e.target.closest('[data-remove]');
  if (remove) {
    const symbol = remove.dataset.remove;
    stocks = stocks.filter(s => s.symbol !== symbol);
    saveStocks();
    renderStocks();
    renderNews();
    logActivity('Stock removed', `${symbol} was removed from your watchlist.`);
    showToast('Removed from watchlist', `${symbol} is no longer tracked.`);
    return;
  }
  const predict = e.target.closest('[data-predict]');
  if (predict) {
    const stock = stocks.find(s => s.symbol === predict.dataset.predict);
    if (!stock || !numericPrice(stock.price)) {
      showToast('Prediction unavailable', 'Enter a current price when adding this stock to see a demo estimate.');
      return;
    }
    stock.predictedPrice = modelPrice(stock);
    renderStocks();
    return;
  }
  const setup = e.target.closest('[data-setup]');
  if (setup) {
    const stock = stocks.find(s => s.symbol === setup.dataset.setup);
    if (stock) openGtt(stock);
    return;
  }
  const summarize = e.target.closest('[data-summarize]');
  if (summarize) openSummary(summarize.dataset.summarize);
});

document.addEventListener('change', e => {
  if (!e.target.matches('.gtt-switch')) return;
  const stock = stocks.find(s => s.symbol === e.target.closest('[data-symbol]').dataset.symbol);
  if (!stock) return;
  if (e.target.checked) {
    e.target.checked = false;
    openGtt(stock);
  } else {
    stock.gtt = false;
    saveStocks();
    renderStocks();
    showToast('GTT paused', `${stock.symbol} alert is off.`);
  }
});

$('#gttForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const stock = stocks.find(s => s.symbol === window.pendingGttSymbol);
  if (!stock) return;
  const trigger = Number($('#gttTrigger').value),
    limit = Number($('#gttLimit').value),
    quantity = Number($('#gttQuantity').value),
    side = $('#gttSide').value;
  if (!trigger || !limit || !Number.isInteger(quantity) || quantity < 1) return;
  if (side === 'BUY' && limit > trigger) {
    showToast('Check your limit price', 'For a buy-below order, limit must be at or below the trigger.');
    return;
  }
  if (side === 'SELL' && limit < trigger) {
    showToast('Check your limit price', 'For a sell-above order, limit must be at or above the trigger.');
    return;
  }
  Object.assign(stock, { gtt: true, side, trigger, limit, quantity });
  $('#gttModal').close();
  renderStocks();
  logActivity('GTT setup saved', `${stock.symbol} · ${side === 'BUY' ? 'Buy' : 'Sell'} ${quantity} at ${money(limit)} (trigger ${money(trigger)})`);
  showToast('GTT setup saved', `${stock.symbol} alert is set at your prices.`);
});

$('#themeToggle')?.addEventListener('click', () => {
  document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  safeSet('marketpilot-theme', document.documentElement.dataset.theme);
  setTheme();
});

$('#menuToggle')?.addEventListener('click', () => $('#sidebar')?.classList.toggle('open'));
$('#toastClose')?.addEventListener('click', () => $('#toast')?.classList.remove('show'));
$('#refreshToken')?.addEventListener('click', () => showToast('Demo connection', 'Live broker connectivity is not configured.'));

renderStocks();
const page = document.body.dataset.page;
if (page === 'overview') initOverview();
if (page === 'watchlist') initWatchlist();
if (page === 'news') initNews();
if (page === 'profile') initProfile();
if (page === 'pricing') initPricing();
if (page === 'auth') initAuth();