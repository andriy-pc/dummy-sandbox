'use strict';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function $(id) {
  return document.getElementById(id);
}

function fmt(n) {
  return '$' + n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fmtUnit(n) {
  return n.toFixed(6);
}

function showResults(id) {
  const el = $(id);
  if (el) el.classList.add('visible');
}

function updateActual(leverageId, posId, actualId) {
  const lev = parseFloat($(leverageId).value);
  const pos = parseFloat($(posId).value);
  $(actualId).textContent = (lev > 0 && pos > 0) ? fmt(lev * pos) : '—';
}

/* ─── Help modal content ─────────────────────────────────────────────────── */

const HELP_CONTENT = {
  'stop-long': {
    title: 'Stop-Loss Calculator — Long',
    body:  'Calculates the stop-loss price for a long position. Enter your entry price and the calculator will show the stop price, distance, loss per unit, total loss, and loss as a percentage of your position size.'
  },
  'stop-short': {
    title: 'Stop-Loss Calculator — Short',
    body:  'Calculates the stop-loss price for a short position. Enter your entry price and the calculator will show the stop price, distance, loss per unit, total loss, and loss as a percentage of your position size.'
  },
  'pnl-long': {
    title: 'PnL Calculator — Long',
    body:  'Calculates profit or loss for a long position. Enter your entry price and current price to see your leveraged position size, total PnL in USD, and PnL as a percentage of your collateral.'
  },
  'pnl-short': {
    title: 'PnL Calculator — Short',
    body:  'Calculates profit or loss for a short position. Enter your entry price and current price to see your leveraged position size, total PnL in USD, and PnL as a percentage of your collateral.'
  },
  'mvm': {
    title: 'Movement % Calculator',
    body:  'Shows how much the price has moved from your entry as a percentage, and whether that move is profitable for your direction. Green indicates a profitable move; red indicates a losing move.'
  },
  'range': {
    title: 'Price Range Calculator',
    body:  'Given an entry price and a move percentage, shows the upper and lower price targets. Useful for setting take-profit and stop-loss levels symmetrically around your entry.'
  },
  'slider-long': {
    title: 'Live PnL Simulator — Long',
    body:  'Drag the slider to simulate different exit prices within ±20% of your entry. Displays real-time USD PnL, percentage PnL, and a liquidation price marker on the track so you can visualise your risk at a glance.'
  },
  'slider-short': {
    title: 'Live PnL Simulator — Short',
    body:  'Drag the slider to simulate different exit prices within ±20% of your entry. Displays real-time USD PnL, percentage PnL, and a liquidation price marker on the track so you can visualise your risk at a glance.'
  },
  'dist-long': {
    title: 'Position Distribution Calculator — Long',
    body:  'Enter your total cross futures account balance and the amount you want to keep in reserve. The calculator shows how much you can safely deploy into positions (spendable) and how much must stay as a liquidation buffer (reserve), displayed in USD and as percentages of your total balance.'
  },
  'dist-short': {
    title: 'Position Distribution Calculator — Short',
    body:  'Enter your total cross futures account balance and the amount you want to keep in reserve. The calculator shows how much you can safely deploy into positions (spendable) and how much must stay as a liquidation buffer (reserve), displayed in USD and as percentages of your total balance.'
  },
  'rr-long': {
    title: 'Risk/Reward Calculator — Long',
    body:  'Evaluates whether a long trade is worth opening. Enter your entry price, take-profit price, and stop-loss price to see the dollar risk, dollar reward, and the resulting ratio. A verdict label tells you at a glance whether the setup is poor, acceptable, good, or excellent.'
  },
  'rr-short': {
    title: 'Risk/Reward Calculator — Short',
    body:  'Evaluates whether a short trade is worth opening. Enter your entry price, take-profit price, and stop-loss price to see the dollar risk, dollar reward, and the resulting ratio. A verdict label tells you at a glance whether the setup is poor, acceptable, good, or excellent.'
  }
};

/* ─── Help modal ─────────────────────────────────────────────────────────── */

function openModal(key) {
  const c = HELP_CONTENT[key];
  if (!c) return;
  $('modal-title').textContent = c.title;
  $('modal-body').textContent  = c.body;
  $('modal-overlay').style.display = 'flex';
}

function closeModal() {
  $('modal-overlay').style.display = 'none';
}

/* ─── Tab switching ──────────────────────────────────────────────────────── */

function switchTab(type) {
  // Update tab button states
  document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
  $('tab-' + type).classList.add('active');

  // Show/hide panels
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  $('panel-' + type).classList.remove('hidden');
}

/* ─── 1. Stop-loss calculator ────────────────────────────────────────────── */

/**
 * Long:  stop below entry — price must NOT fall past stop
 * Short: stop above entry — price must NOT rise past stop
 */
function calcStop(type) {
  const p     = type[0];                        // 'l' or 's'
  const entry = parseFloat($(p + '-stop-entry').value);

  if (!entry || entry <= 0) {
    alert('Please enter a valid entry price.');
    return;
  }

  const leverage = parseFloat($(p + '-stop-leverage').value) || 10;
  const stoploss = (parseFloat($(p + '-stop-sl').value) || 5) / 100;
  const pos = parseFloat($(p + '-stop-pos').value) || 4000;

  const stopPrice  = type === 'long'
    ? entry * (1 - stoploss)
    : entry * (1 + stoploss);

  const dist       = Math.abs(stopPrice - entry);
  const lossPerBtc = dist * leverage;
  const totalLoss  = (dist / entry) * pos * leverage;
  const pct        = (totalLoss / pos) * 100;

  $(p + '-sr-price').textContent  = fmt(stopPrice);
  $(p + '-sr-dist').textContent   = fmt(dist) + '  (' + (stoploss * 100).toFixed(1) + '%)';
  $(p + '-sr-perCurrency').textContent = '−' + fmt(lossPerBtc);
  $(p + '-sr-total').textContent  = '−' + fmt(totalLoss);
  $(p + '-sr-pct').textContent    = '−' + pct.toFixed(2) + '% of position';

  showResults(p + '-stop-results');
}

/* ─── 2. PnL calculator ──────────────────────────────────────────────────── */

/**
 * Long:  profit = (current − entry) × btc_amount
 * Short: profit = (entry − current) × btc_amount
 */
function calcPnl(type) {
  const p       = type[0];
  const entry   = parseFloat($(p + '-pnl-entry').value);
  const current = parseFloat($(p + '-pnl-current').value);

  if (!entry || !current || entry <= 0 || current <= 0) {
    alert('Please enter valid entry and current prices.');
    return;
  }

  const leverage = parseFloat($(p + '-pnl-leverage').value) || 10;
  const pos = parseFloat($(p + '-pnl-pos').value) || 4000;

  const units   = (pos * leverage) / entry;
  const rawPnl  = type === 'long'
    ? (current - entry) * units
    : (entry - current) * units;

  const pnlPct   = (rawPnl / pos) * 100;
  const isProfit = rawPnl >= 0;
  const sign     = isProfit ? '+' : '';

  $(p + '-pr-possize').textContent  = fmt(pos * leverage);
  $(p + '-pr-Currency').textContent = fmtUnit(units);
  $(p + '-pr-lbl').textContent     = isProfit ? 'Profit' : 'Loss';
  $(p + '-pr-pnl').textContent     = sign + fmt(rawPnl);
  $(p + '-pr-pct').textContent     = sign + pnlPct.toFixed(2) + '%';

  const card = $(p + '-pr-card');
  card.classList.remove('metric--profit', 'metric--loss');
  card.classList.add(isProfit ? 'metric--profit' : 'metric--loss');

  showResults(p + '-pnl-results');
}

/* ─── 3. Movement % calculator ───────────────────────────────────────────── */

/**
 * Shows how much price moved from entry in %, and whether position is
 * profitable (long profits on up-move, short profits on down-move).
 */
function calcMvm(type) {
  const p       = type[0];
  const entry   = parseFloat($(p + '-mvm-entry').value);
  const current = parseFloat($(p + '-mvm-current').value);

  if (!entry || !current || entry <= 0 || current <= 0) {
    alert('Please enter valid entry and current prices.');
    return;
  }

  const leverage = parseFloat($(p + '-mvm-leverage').value) || 10;

  const change   = ((current - entry) / entry) * 100;
  const isUp     = change >= 0;
  const isProfit = type === 'long' ? change >= 0 : change <= 0;
  const sign     = isUp ? '+' : '';

  $(p + '-mr-pct').textContent = sign + change.toFixed(2) + '%';

  $(p + '-mr-badge').innerHTML =
    `<span class="status-badge status-badge--${isUp ? 'up' : 'down'}">${isUp ? '▲ up' : '▼ down'}</span>`;

  $(p + '-mr-status').textContent = isProfit ? 'Profitable' : 'Losing';

  const card = $(p + '-mr-status-card');
  card.classList.remove('metric--profit', 'metric--loss');
  card.classList.add(isProfit ? 'metric--profit' : 'metric--loss');

  // Leveraged movement
  const levChange = change * leverage;
  const levSign   = levChange >= 0 ? '+' : '';
  $(p + '-mr-lev').textContent = levSign + levChange.toFixed(2) + '%';

  // Liquidation price and warning
  const liqPrice = type === 'long'
    ? entry * (1 - 1 / leverage)
    : entry * (1 + 1 / leverage);

  const isLiquidated = type === 'long' ? current <= liqPrice : current >= liqPrice;

  const warnEl = $(p + '-mr-liq-warn');
  $(p + '-mr-liq-price').textContent = fmt(liqPrice);
  warnEl.classList.remove('metric--liq-warn--active');
  if (isLiquidated) warnEl.classList.add('metric--liq-warn--active');

  showResults(p + '-mvm-results');
}

/* ─── 4. Price range for % move ──────────────────────────────────────────── */

/**
 * Given an entry price and a move percentage, shows the resulting
 * upper and lower price targets.
 */
function calcPriceMove(type) {
  const p     = type[0];
  const entry = parseFloat($(p + '-pm-entry').value);
  const pct   = parseFloat($(p + '-pm-pct').value);

  if (!entry || entry <= 0) {
    alert('Please enter a valid entry price.');
    return;
  }
  if (!pct || pct <= 0) {
    alert('Please enter a valid move percentage.');
    return;
  }

  const upper = entry * (1 + pct / 100);
  const lower = entry * (1 - pct / 100);

  $(p + '-pm-upper').textContent     = fmt(upper);
  $(p + '-pm-entry-out').textContent = fmt(entry);
  $(p + '-pm-lower').textContent     = fmt(lower);

  showResults(p + '-pm-results');
}

/* ─── 5. Live PnL simulator — slider range initialisation ────────────────── */

/**
 * Called on every oninput of the simulator's entry / leverage / pos fields.
 * Sets the slider range to ±20 % of entry and resets the thumb to entry.
 * Requirements: 5.1, 5.2, 5.3
 */
function onSimInput(type) {
  const p = type[0]; // 'l' or 's'

  // 1. Keep the actual-position field current
  updateActual(p + '-sim-leverage', p + '-sim-pos', p + '-sim-actual');

  const entry = parseFloat($(p + '-sim-entry').value);

  if (entry > 0) {
    const min = entry * 0.80;
    const max = entry * 1.20;

    // 2. Configure the slider range and thumb position
    const slider = $(p + '-sim-range');
    slider.min   = min;
    slider.max   = max;
    slider.value = entry; // midpoint = entry (Req 5.2)

    // 3. Update axis labels
    $(p + '-sim-low').textContent  = fmt(min);
    $(p + '-sim-high').textContent = fmt(max);

    // 4. Entry tick is always at 50 % (entry is the midpoint)
    $(p + '-entry-tick').style.left = '50%';

    // 5. Refresh the readout for the current slider position
    onSlider(type);
  } else {
    // Invalid entry — reset labels and readout
    $(p + '-sim-low').textContent  = '—';
    $(p + '-sim-high').textContent = '—';

    $(p + '-sim-price-out').textContent = '—';
    $(p + '-sim-pnl').textContent       = '—';
    $(p + '-sim-pct').textContent       = '';
    $(p + '-sim-chg').textContent       = '—';
  }
}

/* ─── 6. Live PnL simulator — slider drag handler ────────────────────────── */

/**
 * Called on every oninput of the range slider.
 * Requirements: 6.1, 6.2, 6.3, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5
 */
function onSlider(type) {
  const p        = type[0]; // 'l' or 's'
  const slider   = $(p + '-sim-range');
  const simPrice = parseFloat(slider.value);
  const entry    = parseFloat($(p + '-sim-entry').value);
  const leverage = parseFloat($(p + '-sim-leverage').value) || 10;
  const pos      = parseFloat($(p + '-sim-pos').value) || 4000;
  const min      = parseFloat(slider.min);
  const max      = parseFloat(slider.max);

  if (!entry || entry <= 0 || isNaN(simPrice)) return;

  // PnL calculation
  const pnl = type === 'long'
    ? (simPrice - entry) * (pos * leverage / entry)
    : (entry - simPrice) * (pos * leverage / entry);
  const pnlPct    = (pnl / pos) * 100;
  const priceChg  = simPrice - entry;
  const isProfit  = pnl > 0;
  const isLoss    = pnl < 0;
  const sign      = pnl >= 0 ? '+' : '';

  // Write readout
  $(p + '-sim-price-out').textContent = fmt(simPrice);
  $(p + '-sim-pnl').textContent       = sign + fmt(pnl);
  $(p + '-sim-pct').textContent       = sign + pnlPct.toFixed(2) + '%';
  $(p + '-sim-chg').textContent       = (priceChg >= 0 ? '+' : '') + fmt(priceChg);

  // Color coding
  const card = $(p + '-sim-pnl-card');
  card.classList.remove('metric--profit', 'metric--loss');
  if (isProfit) card.classList.add('metric--profit');
  else if (isLoss) card.classList.add('metric--loss');

  // Fill bars: loss fills from left, profit fills from right
  const range = max - min;
  const thumbPct = range > 0 ? ((simPrice - min) / range) * 100 : 50;
  if (type === 'long') {
    $(p + '-fill-loss').style.width   = thumbPct < 50 ? (50 - thumbPct) + '%' : '0%';
    $(p + '-fill-profit').style.width = thumbPct > 50 ? (thumbPct - 50) + '%' : '0%';
  } else {
    $(p + '-fill-loss').style.width   = thumbPct > 50 ? (thumbPct - 50) + '%' : '0%';
    $(p + '-fill-profit').style.width = thumbPct < 50 ? (50 - thumbPct) + '%' : '0%';
  }

  // Liquidation marker
  const liqPrice = type === 'long'
    ? entry * (1 - 1 / leverage)
    : entry * (1 + 1 / leverage);
  const liqPct = range > 0 ? ((liqPrice - min) / range) * 100 : -1;
  const liqEl  = $(p + '-liq-tick');
  if (liqPct >= 0 && liqPct <= 100) {
    liqEl.style.left    = liqPct + '%';
    liqEl.style.display = 'block';
  } else {
    liqEl.style.display = 'none';
  }
}

/* ─── 7. Position distribution calculator ───────────────────────────────── */

/**
 * Splits account balance into spendable and reserve amounts.
 * Requirements: 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.6
 */
function calcDist(type) {
  const p       = type[0];
  const balance = parseFloat($(p + '-dist-balance').value);
  const reserve = parseFloat($(p + '-dist-reserve').value) || 0;

  if (!isFinite(balance) || balance <= 0) {
    alert('Please enter a valid account balance.');
    return;
  }
  if (reserve < 0) {
    alert('Reserve amount cannot be negative.');
    return;
  }
  if (reserve >= balance) {
    alert('Reserve amount must be less than the account balance.');
    return;
  }

  const spendable    = balance - reserve;
  const spendablePct = Math.round((spendable / balance) * 10000) / 100;
  const reservePct   = Math.round((reserve / balance) * 10000) / 100;

  $(p + '-dist-spendable').textContent   = fmt(spendable);
  $(p + '-dist-spend-pct').textContent   = spendablePct + '%';
  $(p + '-dist-reserve-out').textContent = fmt(reserve);
  $(p + '-dist-res-pct').textContent     = reservePct + '%';

  $(p + '-dist-spend-card').classList.add('metric--profit');
  $(p + '-dist-reserve-card').classList.add('metric--neutral');

  showResults(p + '-dist-results');
}

/* ─── 8. Risk/reward calculator ─────────────────────────────────────────── */

/**
 * Dollar risk: absolute price distance from entry to stop,
 * scaled by leveraged position size.
 * @param {number} entryPrice
 * @param {number} stopPrice
 * @param {number} positionSize - collateral in USD
 * @param {number} leverage
 * @returns {number}
 */
function rrRisk(entryPrice, stopPrice, positionSize, leverage) {
  return (Math.abs(entryPrice - stopPrice) / entryPrice) * positionSize * leverage;
}

/**
 * Dollar reward: absolute price distance from entry to take-profit,
 * scaled by leveraged position size.
 * @param {number} entryPrice
 * @param {number} takeProfitPrice
 * @param {number} positionSize
 * @param {number} leverage
 * @returns {number}
 */
function rrReward(entryPrice, takeProfitPrice, positionSize, leverage) {
  return (Math.abs(entryPrice - takeProfitPrice) / entryPrice) * positionSize * leverage;
}

/**
 * Risk/reward ratio as a plain number (reward ÷ risk).
 * Returns null when risk is zero to signal a divide-by-zero condition.
 * @param {number} reward
 * @param {number} risk
 * @returns {number|null}
 */
function rrRatio(reward, risk) {
  if (risk === 0) return null;
  return reward / risk;
}

/**
 * Plain-language verdict for a given ratio value.
 * @param {number} ratio
 * @returns {string}
 */
function rrVerdict(ratio) {
  if (ratio < 1.0) return 'Poor \u2014 risk outweighs reward';
  if (ratio < 1.5) return 'Acceptable';
  if (ratio < 2.0) return 'Good';
  return 'Excellent';
}

/**
 * Reads inputs, validates direction, calls pure helpers, writes results.
 * @param {'long'|'short'} type
 */
function calcRR(type) {
  const p      = type[0];
  const entry  = parseFloat($(p + '-rr-entry').value);
  const tp     = parseFloat($(p + '-rr-tp').value);
  const sl     = parseFloat($(p + '-rr-sl').value);
  const leverage = parseFloat($(p + '-rr-leverage').value) || 10;
  const pos    = parseFloat($(p + '-rr-pos').value) || 4000;

  if (!entry || entry <= 0) {
    alert('Please enter a valid entry price.');
    return;
  }
  if (!tp || tp <= 0) {
    alert('Please enter a valid take-profit price.');
    return;
  }
  if (!sl || sl <= 0) {
    alert('Please enter a valid stop-loss price.');
    return;
  }

  if (type === 'long') {
    if (tp <= entry) {
      alert('Take-profit must be above the entry price for a long position.');
      return;
    }
    if (sl >= entry) {
      alert('Stop-loss must be below the entry price for a long position.');
      return;
    }
  } else {
    if (tp >= entry) {
      alert('Take-profit must be below the entry price for a short position.');
      return;
    }
    if (sl <= entry) {
      alert('Stop-loss must be above the entry price for a short position.');
      return;
    }
  }

  updateActual(p + '-rr-leverage', p + '-rr-pos', p + '-rr-actual');

  const risk   = rrRisk(entry, sl, pos, leverage);
  const reward = rrReward(entry, tp, pos, leverage);
  const ratio  = rrRatio(reward, risk);

  if (ratio === null) {
    alert('Stop-loss price equals entry price — risk is zero, cannot compute ratio.');
    return;
  }

  const verdict    = rrVerdict(ratio);
  const verdictEl  = $(p + '-rr-verdict-card');

  verdictEl.classList.remove('metric--loss', 'metric--neutral', 'metric--profit');
  if (ratio < 1.0) {
    verdictEl.classList.add('metric--loss');
  } else if (ratio < 1.5) {
    verdictEl.classList.add('metric--neutral');
  } else {
    verdictEl.classList.add('metric--profit');
  }

  $(p + '-rr-risk').textContent    = fmt(risk);
  $(p + '-rr-reward').textContent  = fmt(reward);
  $(p + '-rr-ratio').textContent   = '1 : ' + ratio.toFixed(2);
  $(p + '-rr-verdict').textContent = verdict;

  showResults(p + '-rr-results');
}

/* ─── Event binding ──────────────────────────────────────────────────────── */

function bindEvents() {
  // Modal overlay — close on backdrop click, stop propagation on modal itself
  $('modal-overlay').addEventListener('click', closeModal);
  $('modal-inner').addEventListener('click', e => e.stopPropagation());
  $('modal-close').addEventListener('click', closeModal);

  // Help buttons — keyed by data-modal attribute
  document.querySelectorAll('.help-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.modal));
  });

  // Tab buttons
  $('tab-long').addEventListener('click', () => switchTab('long'));
  $('tab-short').addEventListener('click', () => switchTab('short'));

  // ── Long panel ──────────────────────────────────────────────────────────

  // Simulator inputs
  ['l-sim-entry', 'l-sim-leverage', 'l-sim-pos'].forEach(id => {
    $(id).addEventListener('input', () => onSimInput('long'));
  });
  $('l-sim-range').addEventListener('input', () => onSlider('long'));

  // Stop-loss actual + calculate
  ['l-stop-entry', 'l-stop-leverage', 'l-stop-pos'].forEach(id => {
    $(id).addEventListener('input', () => updateActual('l-stop-leverage', 'l-stop-pos', 'l-stop-actual'));
  });
  $('l-stop-btn').addEventListener('click', () => calcStop('long'));

  // PnL actual + calculate
  ['l-pnl-entry', 'l-pnl-leverage', 'l-pnl-pos'].forEach(id => {
    $(id).addEventListener('input', () => updateActual('l-pnl-leverage', 'l-pnl-pos', 'l-pnl-actual'));
  });
  $('l-pnl-btn').addEventListener('click', () => calcPnl('long'));

  // Movement actual + calculate
  ['l-mvm-entry', 'l-mvm-leverage', 'l-mvm-pos'].forEach(id => {
    $(id).addEventListener('input', () => updateActual('l-mvm-leverage', 'l-mvm-pos', 'l-mvm-actual'));
  });
  $('l-mvm-btn').addEventListener('click', () => calcMvm('long'));

  // Price range actual + calculate
  ['l-pm-entry', 'l-pm-leverage', 'l-pm-pos'].forEach(id => {
    $(id).addEventListener('input', () => updateActual('l-pm-leverage', 'l-pm-pos', 'l-pm-actual'));
  });
  $('l-pm-btn').addEventListener('click', () => calcPriceMove('long'));

  // ── Short panel ─────────────────────────────────────────────────────────

  // Simulator inputs
  ['s-sim-entry', 's-sim-leverage', 's-sim-pos'].forEach(id => {
    $(id).addEventListener('input', () => onSimInput('short'));
  });
  $('s-sim-range').addEventListener('input', () => onSlider('short'));

  // Stop-loss actual + calculate
  ['s-stop-entry', 's-stop-leverage', 's-stop-pos'].forEach(id => {
    $(id).addEventListener('input', () => updateActual('s-stop-leverage', 's-stop-pos', 's-stop-actual'));
  });
  $('s-stop-btn').addEventListener('click', () => calcStop('short'));

  // PnL actual + calculate
  ['s-pnl-entry', 's-pnl-leverage', 's-pnl-pos'].forEach(id => {
    $(id).addEventListener('input', () => updateActual('s-pnl-leverage', 's-pnl-pos', 's-pnl-actual'));
  });
  $('s-pnl-btn').addEventListener('click', () => calcPnl('short'));

  // Movement actual + calculate
  ['s-mvm-entry', 's-mvm-leverage', 's-mvm-pos'].forEach(id => {
    $(id).addEventListener('input', () => updateActual('s-mvm-leverage', 's-mvm-pos', 's-mvm-actual'));
  });
  $('s-mvm-btn').addEventListener('click', () => calcMvm('short'));

  // Price range actual + calculate
  ['s-pm-entry', 's-pm-leverage', 's-pm-pos'].forEach(id => {
    $(id).addEventListener('input', () => updateActual('s-pm-leverage', 's-pm-pos', 's-pm-actual'));
  });
  $('s-pm-btn').addEventListener('click', () => calcPriceMove('short'));
}

// bindEvents() is called by auth.js via script.onload after dynamic injection.
bindEvents();
