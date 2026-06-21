const qrImg = document.getElementById('qr');
const overlay = document.getElementById('overlay');
const countdownEl = document.getElementById('countdown');
const statusEl = document.getElementById('status');

let refreshIntervalMs = 10000;
let nextRotationAt = Date.now() + refreshIntervalMs;
let lastRotationId = -1;
let isRefreshing = false;

function setRefreshing(on) {
  isRefreshing = on;
  overlay.classList.toggle('hidden', !on);
  statusEl.textContent = on ? '刷新中' : '已就绪';
  statusEl.classList.toggle('refreshing', on);
}

async function refreshQr() {
  if (isRefreshing) return;
  setRefreshing(true);
  try {
    qrImg.src = `/api/qrcode?t=${Date.now()}`;
    await new Promise((resolve) => {
      if (qrImg.complete) return resolve();
      qrImg.onload = resolve;
      qrImg.onerror = resolve;
    });
  } finally {
    setTimeout(() => setRefreshing(false), 200);
  }
}

async function pollStatus() {
  try {
    const r = await fetch('/api/status', { cache: 'no-store' });
    const d = await r.json();
    refreshIntervalMs = d.refreshIntervalMs;
    nextRotationAt = Date.now() + d.msUntilNextRotation;
    if (d.rotationId !== lastRotationId) {
      lastRotationId = d.rotationId;
      refreshQr();
    }
  } catch {
    statusEl.textContent = '连接失败';
    statusEl.classList.add('refreshing');
  }
}

function tick() {
  const remaining = Math.max(0, Math.ceil((nextRotationAt - Date.now()) / 1000));
  countdownEl.textContent = remaining;
}

(async () => {
  setRefreshing(true);
  await pollStatus();
  refreshQr();
  setInterval(pollStatus, 500);
  setInterval(tick, 250);
})();
