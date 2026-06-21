const crypto = require('crypto');

class TokenStore {
  constructor(intervalMs) {
    this.intervalMs = intervalMs;
    this.currentToken = null;
    this.lastRotation = 0;
    this.rotationId = 0;
    this._timer = null;
  }

  start() {
    this.rotate();
    this._timer = setInterval(() => this.rotate(), this.intervalMs);
    if (this._timer.unref) this._timer.unref();
  }

  stop() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  }

  rotate() {
    this.currentToken = crypto.randomBytes(16).toString('hex');
    this.lastRotation = Date.now();
    this.rotationId += 1;
  }

  getCurrent() {
    return this.currentToken;
  }

  getRotationId() {
    return this.rotationId;
  }

  isValid(token) {
    return !!token && token === this.currentToken;
  }

  getMsUntilNextRotation() {
    const elapsed = Date.now() - this.lastRotation;
    return Math.max(0, this.intervalMs - elapsed);
  }
}

module.exports = { TokenStore };
