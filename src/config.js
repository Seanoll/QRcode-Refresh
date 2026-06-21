require('dotenv').config({ quiet: true });

function parseInterval(value, fallback) {
  const ms = Number(value);
  return Number.isFinite(ms) && ms > 0 ? ms : fallback;
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  targetUrl: process.env.TARGET_URL || 'https://github.com/Seanoll/QRcode-Refresh',
  refreshIntervalMs: parseInterval(process.env.REFRESH_INTERVAL_MS, 10000),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, ''),
};
