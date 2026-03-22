'use strict';

/**
 * Unit tests for calc.js logic.
 * Run with: node tests.js
 *
 * No dependencies — uses Node's built-in assert module.
 */

const assert = require('assert/strict');

/* ─── Pure calculation helpers (mirroring calc.js formulas) ─────────────── */

function fmt(n) {
  return '$' + n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtUnit(n) {
  return n.toFixed(6);
}

function stopPrice(type, entry, slPct) {
  return type === 'long'
    ? entry * (1 - slPct)
    : entry * (1 + slPct);
}

function stopDist(price, entry) {
  return Math.abs(price - entry);
}

function lossPerBtc(dist, leverage) {
  return dist * leverage;
}

function totalLoss(dist, entry, pos, leverage) {
  return (dist / entry) * pos * leverage;
}

function lossPct(loss, pos) {
  return (loss / pos) * 100;
}

function pnl(type, entry, current, pos, leverage) {
  const btc = (pos * leverage) / entry;
  return type === 'long'
    ? (current - entry) * btc
    : (entry - current) * btc;
}

function pnlPct(rawPnl, pos) {
  return (rawPnl / pos) * 100;
}

function btcAmount(pos, leverage, entry) {
  return (pos * leverage) / entry;
}

function movement(entry, current) {
  return ((current - entry) / entry) * 100;
}

function upper(entry, pct) {
  return entry * (1 + pct / 100);
}

function lower(entry, pct) {
  return entry * (1 - pct / 100);
}

function simPnl(type, simPrice, entry, pos, leverage) {
  return type === 'long'
    ? (simPrice - entry) * (pos * leverage / entry)
    : (entry - simPrice) * (pos * leverage / entry);
}

function liqPrice(type, entry, leverage) {
  return type === 'long'
    ? entry * (1 - 1 / leverage)
    : entry * (1 + 1 / leverage);
}

function thumbPct(simPrice, min, max) {
  const range = max - min;
  return range > 0 ? ((simPrice - min) / range) * 100 : 50;
}

/* ─── Test runner ────────────────────────────────────────────────────────── */

let passed = 0;
let failed = 0;
let currentSuite = '';

function suite(name) {
  currentSuite = name;
  console.log(`\n${name}`);
}

function test(desc, fn) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${desc}\n    ${e.message}`);
    failed++;
  }
}

function assertClose(a, b, tol = 1e-9) {
  if (Math.abs(a - b) > tol) {
    throw new Error(`expected ${b}, got ${a} (tol ${tol})`);
  }
}

/* ─── fmt / fmtBtc ───────────────────────────────────────────────────────── */

suite('fmt');
test('zero',             () => assert.equal(fmt(0), '$0.00'));
test('integer with sep', () => assert.equal(fmt(1000), '$1,000.00'));
test('decimal',          () => assert.equal(fmt(1234.5), '$1,234.50'));
test('negative',         () => assert.equal(fmt(-500), '$-500.00'));

suite('fmtUnit');
test('6 decimal places', () => assert.equal(fmtUnit(0.123456789), '0.123457'));
test('zero',             () => assert.equal(fmtUnit(0), '0.000000'));

/* ─── Stop-loss calculator ───────────────────────────────────────────────── */

suite('stopPrice');
test('long stop is below entry',  () => assertClose(stopPrice('long',  50000, 0.05), 47500));
test('short stop is above entry', () => assertClose(stopPrice('short', 50000, 0.05), 52500));
test('0% sl → stop equals entry (long)',  () => assertClose(stopPrice('long',  50000, 0), 50000));
test('0% sl → stop equals entry (short)', () => assertClose(stopPrice('short', 50000, 0), 50000));

suite('stopDist');
test('distance is positive for long',  () => assert.ok(stopDist(stopPrice('long',  50000, 0.05), 50000) > 0));
test('distance is positive for short', () => assert.ok(stopDist(stopPrice('short', 50000, 0.05), 50000) > 0));
test('distance = entry × slPct',       () => assertClose(stopDist(stopPrice('long', 50000, 0.05), 50000), 2500));

suite('lossPerBtc');
test('dist × leverage',       () => assertClose(lossPerBtc(2500, 10), 25000));
test('leverage 1 → equals dist', () => assertClose(lossPerBtc(2500, 1), 2500));

suite('totalLoss');
test('formula: (dist/entry) × pos × leverage', () => assertClose(totalLoss(2500, 50000, 4000, 10), 2000));
test('scales linearly with leverage', () => {
  assertClose(totalLoss(2500, 50000, 4000, 20), totalLoss(2500, 50000, 4000, 10) * 2);
});

suite('lossPct');
test('(totalLoss / pos) × 100', () => assertClose(lossPct(2000, 4000), 50));
test('100% when loss equals pos', () => assertClose(lossPct(4000, 4000), 100));

/* ─── PnL calculator ─────────────────────────────────────────────────────── */

suite('pnl — long');
test('profit when current > entry', () => assertClose(pnl('long', 50000, 55000, 4000, 10), 4000));
test('loss when current < entry',   () => assertClose(pnl('long', 50000, 45000, 4000, 10), -4000));
test('zero when current = entry',   () => assertClose(pnl('long', 50000, 50000, 4000, 10), 0));

suite('pnl — short');
test('profit when current < entry', () => assertClose(pnl('short', 50000, 45000, 4000, 10), 4000));
test('loss when current > entry',   () => assertClose(pnl('short', 50000, 55000, 4000, 10), -4000));
test('zero when current = entry',   () => assertClose(pnl('short', 50000, 50000, 4000, 10), 0));

suite('pnlPct');
test('100% when pnl equals pos',  () => assertClose(pnlPct(4000, 4000), 100));
test('negative for loss',         () => assertClose(pnlPct(-2000, 4000), -50));

suite('btcAmount');
test('(pos × leverage) / entry',  () => assertClose(btcAmount(4000, 10, 50000), 0.8));
test('scales with leverage',      () => assertClose(btcAmount(4000, 20, 50000), btcAmount(4000, 10, 50000) * 2));

/* ─── Movement % calculator ──────────────────────────────────────────────── */

suite('movement');
test('up move is positive',   () => assertClose(movement(50000, 55000), 10));
test('down move is negative', () => assertClose(movement(50000, 45000), -10));
test('no move is zero',       () => assertClose(movement(50000, 50000), 0));
test('formula check',         () => assertClose(movement(40000, 42000), 5));

/* ─── Price range calculator ─────────────────────────────────────────────── */

suite('upper / lower');
test('upper = entry × (1 + pct/100)',  () => assertClose(upper(50000, 10), 55000));
test('lower = entry × (1 - pct/100)',  () => assertClose(lower(50000, 10), 45000));
test('symmetric around entry', () => {
  assertClose(upper(50000, 7) - 50000, 50000 - lower(50000, 7));
});
test('0% → both equal entry', () => {
  assertClose(upper(50000, 0), 50000);
  assertClose(lower(50000, 0), 50000);
});
test('100% → upper is 2× entry', () => assertClose(upper(50000, 100), 100000));

/* ─── Live PnL simulator ─────────────────────────────────────────────────── */

suite('simPnl');
test('long: at entry → 0',         () => assertClose(simPnl('long',  50000, 50000, 4000, 10), 0));
test('short: at entry → 0',        () => assertClose(simPnl('short', 50000, 50000, 4000, 10), 0));
test('long: above entry → profit', () => assert.ok(simPnl('long',  55000, 50000, 4000, 10) > 0));
test('short: below entry → profit',() => assert.ok(simPnl('short', 45000, 50000, 4000, 10) > 0));
test('long: below entry → loss',   () => assert.ok(simPnl('long',  45000, 50000, 4000, 10) < 0));
test('short: above entry → loss',  () => assert.ok(simPnl('short', 55000, 50000, 4000, 10) < 0));
test('matches pnl() for same inputs', () => {
  assertClose(simPnl('long', 55000, 50000, 4000, 10), pnl('long', 50000, 55000, 4000, 10));
});

suite('liqPrice');
test('long liq is below entry',  () => assert.ok(liqPrice('long',  50000, 10) < 50000));
test('short liq is above entry', () => assert.ok(liqPrice('short', 50000, 10) > 50000));
test('long:  entry × (1 - 1/lev)', () => assertClose(liqPrice('long',  50000, 10), 45000));
test('short: entry × (1 + 1/lev)', () => assertClose(liqPrice('short', 50000, 10), 55000));
test('higher leverage → long liq closer to entry', () => {
  assert.ok(liqPrice('long', 50000, 20) > liqPrice('long', 50000, 10));
});
test('higher leverage → short liq closer to entry', () => {
  assert.ok(liqPrice('short', 50000, 20) < liqPrice('short', 50000, 10));
});

suite('thumbPct');
test('entry at midpoint → 50%', () => assertClose(thumbPct(50000, 40000, 60000), 50));
test('price at min → 0%',       () => assertClose(thumbPct(40000, 40000, 60000), 0));
test('price at max → 100%',     () => assertClose(thumbPct(60000, 40000, 60000), 100));
test('zero range → 50',         () => assertClose(thumbPct(50000, 50000, 50000), 50));

/* ─── auth.js pure helpers ───────────────────────────────────────────────── */

function buildCredentialString(username, password) {
  return username + password;
}

function hexFromBuffer(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function isEmptyCredential(username, password) {
  return username === '' || password === '';
}

suite('buildCredentialString');
test('concatenates username and password with no separator', () => {
  assert.equal(buildCredentialString('alice', 'secret'), 'alicesecret');
});
test('empty username yields just the password', () => {
  assert.equal(buildCredentialString('', 'secret'), 'secret');
});
test('empty password yields just the username', () => {
  assert.equal(buildCredentialString('alice', ''), 'alice');
});
test('both empty yields empty string', () => {
  assert.equal(buildCredentialString('', ''), '');
});
test('length equals sum of both lengths', () => {
  const u = 'foo';
  const p = 'bar123';
  assert.equal(buildCredentialString(u, p).length, u.length + p.length);
});

suite('hexFromBuffer');
test('[0x00] → "00"', () => {
  assert.equal(hexFromBuffer(new Uint8Array([0x00]).buffer), '00');
});
test('[0xff] → "ff"', () => {
  assert.equal(hexFromBuffer(new Uint8Array([0xff]).buffer), 'ff');
});
test('[0xde, 0xad] → "dead"', () => {
  assert.equal(hexFromBuffer(new Uint8Array([0xde, 0xad]).buffer), 'dead');
});
test('single-digit hex values are zero-padded', () => {
  assert.equal(hexFromBuffer(new Uint8Array([0x0f]).buffer), '0f');
});
test('output length is 2× input byte count', () => {
  const bytes = new Uint8Array([0x01, 0x02, 0x03]);
  assert.equal(hexFromBuffer(bytes.buffer).length, bytes.length * 2);
});

suite('isEmptyCredential');
test('both empty → true', () => {
  assert.equal(isEmptyCredential('', ''), true);
});
test('empty username → true', () => {
  assert.equal(isEmptyCredential('', 'secret'), true);
});
test('empty password → true', () => {
  assert.equal(isEmptyCredential('alice', ''), true);
});
test('both non-empty → false', () => {
  assert.equal(isEmptyCredential('alice', 'secret'), false);
});

/* ─── Summary ────────────────────────────────────────────────────────────── */

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
