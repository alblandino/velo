class FlushallCommand {
  static get nombre() { return 'FLUSHALL'; }

  execute(store) {
    store.flushAll();
    return { ok: 'OK' };
  }
}

module.exports = { FlushallCommand };
