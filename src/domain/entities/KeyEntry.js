const TipoDato = Object.freeze({
  STRING: 'string',
  LIST: 'list',
  HASH: 'hash',
  SET: 'set',
});

class KeyEntry {
  constructor(value, type = TipoDato.STRING, expiresAt = null) {
    this.value = value;
    this.type = type;
    this.expiresAt = expiresAt;
  }

  isExpired() {
    if (this.expiresAt === null) return false;
    return Date.now() >= this.expiresAt;
  }

  getTtlSegundos() {
    if (this.expiresAt === null) return -1;
    if (this.isExpired()) return -2;
    return Math.ceil((this.expiresAt - Date.now()) / 1000);
  }

  getTtlMs() {
    if (this.expiresAt === null) return -1;
    if (this.isExpired()) return -2;
    return this.expiresAt - Date.now();
  }
}

module.exports = { TipoDato, KeyEntry };
