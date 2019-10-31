const { IDataStore } = require('../../domain/ports/IDataStore.js');
const { KeyEntry } = require('../../domain/entities/KeyEntry.js');
const { t } = require('../../i18n');

function globARegExp(patron) {
  const escapado = patron
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escapado}$`, 'i');
}

class InMemoryStore extends IDataStore {
  constructor(config) {
    super();

    this._config = config;

    this._bases = new Map();

    for (let i = 0; i < this._config.DB_COUNT; i++) {
      this._bases.set(i, new Map());
    }

    this._sweepTimer = null;
  }

  _obtenerBase(db) {
    if (db < 0 || db >= this._config.DB_COUNT) {
      throw new Error(t('almacen.baseFueraDeRango', { db, maximo: this._config.DB_COUNT - 1 }));
    }
    return this._bases.get(db);
  }

  get(db, key) {
    const base = this._obtenerBase(db);
    const entrada = base.get(key);

    if (!entrada) return null;

    if (entrada.isExpired()) {
      base.delete(key);
      return null;
    }

    return entrada;
  }

  set(db, key, entry) {
    this._obtenerBase(db).set(key, entry);
  }

  del(db, ...keys) {
    const base = this._obtenerBase(db);
    let eliminadas = 0;

    for (const key of keys) {
      if (base.delete(key)) eliminadas++;
    }

    return eliminadas;
  }

  exists(db, key) {
    return this.get(db, key) !== null;
  }

  keys(db, patron) {
    const base = this._obtenerBase(db);
    const regexp = globARegExp(patron);
    const resultado = [];

    for (const [key, entrada] of base) {
      if (entrada.isExpired()) {
        base.delete(key);
        continue;
      }
      if (regexp.test(key)) {
        resultado.push(key);
      }
    }

    return resultado;
  }

  dbsize(db) {
    const base = this._obtenerBase(db);
    let activas = 0;

    for (const [key, entrada] of base) {
      if (entrada.isExpired()) {
        base.delete(key);
      } else {
        activas++;
      }
    }

    return activas;
  }

  flushDb(db) {
    this._obtenerBase(db).clear();
  }

  flushAll() {
    for (const base of this._bases.values()) {
      base.clear();
    }
  }

  iniciarSweep() {
    if (this._sweepTimer) return;

    this._sweepTimer = setInterval(() => {
      let totalEliminadas = 0;

      for (const base of this._bases.values()) {
        for (const [key, entrada] of base) {
          if (entrada.isExpired()) {
            base.delete(key);
            totalEliminadas++;
          }
        }
      }

      if (totalEliminadas > 0 && this._config.LOG_LEVEL === 'debug') {
        console.log(`[velo:store] ${t('almacen.sweep', { total: totalEliminadas })}`);
      }
    }, this._config.SWEEP_INTERVAL_MS);

    this._sweepTimer.unref();
  }

  detenerSweep() {
    if (this._sweepTimer) {
      clearInterval(this._sweepTimer);
      this._sweepTimer = null;
    }
  }
}

module.exports = { InMemoryStore };
