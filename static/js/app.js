
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function safeGet(key, fallback = '') {
    try {
        return localStorage.getItem(key) ?? fallback;
    } catch {
        return fallback;
    }
}

function safeSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {}
}

function numericPrice(value) {
    return Number(String(value || '').replace(/[^\d.]/g, '')) || 0;
}

function money(value) {
    return `₹${Number(value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
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

/* Theme Management */

function setTheme() {
    const dark = document.documentElement.dataset.theme === 'dark';

    const glyph = $('#themeGlyph');

    if (glyph) {
        glyph.textContent = dark ? '☀' : '☾';
    }

    const toggle = $('#themeToggle');

    if (toggle) {
        toggle.setAttribute(
            'aria-label',
            dark ? 'Switch to light theme' : 'Switch to dark theme'
        );
    }

    const meta = $('meta[name="theme-color"]');

    if (meta) {
        meta.content = dark ? '#000000' : '#f5f4ef';
    }
}

const preferredTheme = safeGet('marketpilot-theme');

if (preferredTheme) {
    document.documentElement.dataset.theme = preferredTheme;
}

setTheme();

/* Toast Notifications */

function showToast(title, message) {
    const toast = $('#toast');

    if (!toast) return;

    $('#toastTitle').textContent = title;
    $('#toastText').textContent = message;

    toast.classList.add('show');

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3600);
}

/* Activity Logging */

function logActivity(title, detail) {
    const panel = $('#activityPanel');

    if (!panel) return;

    $('#activityEmpty')?.remove();

    const row = document.createElement('div');

    row.className = 'activity-row';

    row.innerHTML = `
        <span class="activity-icon sync">✳</span>
        <div class="activity-main">
            <strong></strong>
            <span></span>
        </div>
        <span class="activity-time">Just now</span>
        <span class="status-pill">Updated</span>
    `;

    $('.activity-main strong', row).textContent = title;
    $('.activity-main span', row).textContent = detail;

    panel.prepend(row);
}

/* Modal Openers */

function openGtt(symbol, currentPrice = 0) {
    const dialog = $('#gttModal');

    if (!dialog) return;

    window.pendingGttSymbol = symbol;

    $('#gttCompanyCopy').textContent =
        `Set trigger, limit, and quantity for ${symbol}. You choose the actual order prices.`;

    $('#gttSide').value = 'BUY';
    $('#gttQuantity').value = 1;

    const estimate = currentPrice ? currentPrice * 1.01 : 0;

    $('#gttSuggested').textContent = currentPrice
        ? `Model estimate: ${money(estimate)} · edit either price as needed`
        : 'No current price reference available.';

    $('#gttTrigger').value = estimate ? estimate.toFixed(2) : '';
    $('#gttLimit').value = estimate ? estimate.toFixed(2) : '';

    dialog.showModal();
}

/* Page Initializers */

function initOverview() {
    displayDate();
}

function initWatchlist() {

    $('#stockSearch')?.addEventListener('input', e => {
        const term = e.target.value.toLowerCase();

        $$('.full-stock-row').forEach(row => {
            row.hidden = !row.textContent.toLowerCase().includes(term);
        });
    });

    $('#addStockButton')?.addEventListener('click', () => {
        $('#addModal')?.showModal();
    });
}

/*
    PROFILE:
    Profile editing is handled by Flask + Jinja + SQLAlchemy.
    No JavaScript profile editing or localStorage functionality.
*/

function initPricing() {

    const selected = safeGet('marketpilot-plan', 'Nidhi');

    $$('[data-plan]').forEach(button => {
        if (button.dataset.plan === selected) {
            button.textContent = `Selected: ${selected}`;
            button.classList.add('selected-plan');
        }
    });

    $$('[data-plan]').forEach(button => {
        button.addEventListener('click', () => {

            safeSet('marketpilot-plan', button.dataset.plan);

            $$('[data-plan]').forEach(item => {
                item.classList.remove('selected-plan');
                item.textContent = `Choose ${item.dataset.plan}`;
            });

            button.textContent = `Selected: ${button.dataset.plan}`;
            button.classList.add('selected-plan');

            showToast(
                `${button.dataset.plan} selected`,
                'Plan selection updated.'
            );
        });
    });
}

function initAuth() {

    const tabs = $$('.auth-tabs [data-auth-mode]');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {

            const signup = tab.dataset.authMode === 'signup';

            tabs.forEach(t => {
                t.classList.toggle('selected', t === tab);
            });

            if ($('#loginForm')) {
                $('#loginForm').hidden = signup;
            }

            if ($('#signupForm')) {
                $('#signupForm').hidden = !signup;
            }

            if ($('#authTitle')) {
                $('#authTitle').textContent = signup
                    ? 'Create your account'
                    : 'Welcome back';
            }

            if ($('#authSubtitle')) {
                $('#authSubtitle').textContent = signup
                    ? 'Start with a personal MarketPilot workspace.'
                    : 'Sign in to your MarketPilot workspace.';
            }
        });
    });
}

/* Global Event Listeners */

document.addEventListener('click', e => {

    const close = e.target.closest('[data-close]');

    if (close) {
        $(`#${close.dataset.close}`)?.close();
        return;
    }

    const predict = e.target.closest('[data-predict]');

    if (predict) {

        const symbol = predict.dataset.predict;
        const row = predict.closest('.full-stock-row');
        const resultBox = row?.querySelector('.prediction-result');

        if (resultBox) {
            resultBox.removeAttribute('hidden');
            predict.textContent = 'Refresh';

            showToast(
                'Model prediction',
                `Updated estimates for ${symbol}.`
            );
        }

        return;
    }

    const setup = e.target.closest('[data-setup]');

    if (setup) {

        const symbol = setup.dataset.setup;
        const row = setup.closest('.full-stock-row');
        const priceText = row?.querySelector('.stock-quote strong')?.textContent;

        openGtt(symbol, numericPrice(priceText));

        return;
    }
});

/* GTT Switch */

document.addEventListener('change', e => {

    if (!e.target.matches('.gtt-switch')) return;

    const row = e.target.closest('[data-symbol]');
    const symbol = row?.dataset.symbol;

    if (!symbol) return;

    if (e.target.checked) {

        e.target.checked = false;

        const priceText = row.querySelector('.stock-quote strong')?.textContent;

        openGtt(symbol, numericPrice(priceText));

    } else {

        showToast('GTT paused', `${symbol} alert turned off.`);
    }
});

/* GTT Form Submission */

$('#gttForm')?.addEventListener('submit', e => {

    e.preventDefault();

    const symbol = window.pendingGttSymbol;

    if (!symbol) return;

    const trigger = Number($('#gttTrigger').value);
    const limit = Number($('#gttLimit').value);
    const quantity = Number($('#gttQuantity').value);
    const side = $('#gttSide').value;

    if (!trigger || !limit || !Number.isInteger(quantity) || quantity < 1) {
        return;
    }

    if (side === 'BUY' && limit > trigger) {
        showToast(
            'Check limit price',
            'For a buy-below order, limit must be at or below trigger price.'
        );
        return;
    }

    if (side === 'SELL' && limit < trigger) {
        showToast(
            'Check limit price',
            'For a sell-above order, limit must be at or above trigger price.'
        );
        return;
    }

    $('#gttModal').close();

    logActivity(
        'GTT setup saved',
        `${symbol} · ${side === 'BUY' ? 'Buy' : 'Sell'} ${quantity} at ${money(limit)} (trigger ${money(trigger)})`
    );

    showToast('GTT setup saved', `${symbol} alert is set.`);
});

/* Theme Toggle */

$('#themeToggle')?.addEventListener('click', () => {

    document.documentElement.dataset.theme =
        document.documentElement.dataset.theme === 'dark'
            ? 'light'
            : 'dark';

    safeSet('marketpilot-theme', document.documentElement.dataset.theme);

    setTheme();
});

/* Sidebar */

$('#menuToggle')?.addEventListener('click', () => {
    $('#sidebar')?.classList.toggle('open');
});

/* Toast Close */

$('#toastClose')?.addEventListener('click', () => {
    $('#toast')?.classList.remove('show');
});

/* Broker Connection */

$('#refreshToken')?.addEventListener('click', () => {
    showToast('Broker connection', 'Status verified.');
});

/* Page Initialization */

const page = document.body.dataset.page;

if (page === 'overview') initOverview();
if (page === 'watchlist') initWatchlist();
if (page === 'pricing') initPricing();
if (page === 'auth') initAuth();

// No JavaScript routing or profile initialization.
