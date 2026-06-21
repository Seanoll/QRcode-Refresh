const express = require('express');
const path = require('path');
const QRCode = require('qrcode');

const config = require('./src/config');
const { TokenStore } = require('./src/tokenStore');

const app = express();
const tokenStore = new TokenStore(config.refreshIntervalMs);

app.use(express.static(path.join(__dirname, 'public')));

function buildScanUrl(token) {
  return `${config.publicBaseUrl}/scan?token=${token}`;
}

app.get('/api/qrcode', async (req, res) => {
  try {
    const token = tokenStore.getCurrent();
    if (!token) {
      res.status(503).send('QR not ready');
      return;
    }
    const url = buildScanUrl(token);
    const svg = await QRCode.toString(url, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
    });
    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(svg);
  } catch (err) {
    console.error('[qrcode]', err);
    res.status(500).send('Failed to generate QR code');
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    refreshIntervalMs: config.refreshIntervalMs,
    msUntilNextRotation: tokenStore.getMsUntilNextRotation(),
    rotationId: tokenStore.getRotationId(),
    hasTarget: Boolean(config.targetUrl),
  });
});

const EXPIRED_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>二维码已失效</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:center;padding:64px 24px;color:#333;background:#f7f7f9}
  .box{max-width:360px;margin:0 auto}
  h1{font-size:20px;margin:0 0 8px}
  p{color:#888;margin:0;font-size:14px}
  .icon{font-size:48px;margin-bottom:12px}
</style>
</head>
<body>
  <div class="box">
    <div class="icon">⏱</div>
    <h1>二维码已失效</h1>
    <p>请扫描屏幕上最新的二维码</p>
  </div>
</body>
</html>`;

app.get('/scan', (req, res) => {
  const { token } = req.query;
  if (!tokenStore.isValid(token)) {
    res.status(410).type('html').send(EXPIRED_HTML);
    return;
  }
  if (!config.targetUrl) {
    res.status(500).send('TARGET_URL is not configured');
    return;
  }
  res.redirect(302, config.targetUrl);
});

const server = app.listen(config.port, () => {
  console.log(`qrcode-refresh running at http://localhost:${config.port}`);
  console.log(`  target          : ${config.targetUrl}`);
  console.log(`  refresh interval: ${config.refreshIntervalMs} ms`);
  if (!config.publicBaseUrl) {
    console.warn('  WARNING: PUBLIC_BASE_URL is empty. Scanned URL will be relative and unusable.');
  } else {
    console.log(`  public base url : ${config.publicBaseUrl}`);
  }
  tokenStore.start();
});

function shutdown() {
  tokenStore.stop();
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
